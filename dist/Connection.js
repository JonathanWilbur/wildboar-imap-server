"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConnectionState_1 = require("./ConnectionState");
const Lexeme_1 = require("./Lexeme");
const Scanner_1 = require("./Scanner");
const uuid_1 = require("uuid");
class Connection {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = `urn:uuid:${uuid_1.v4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.Scanner();
        this.currentlySelectedMailbox = "INBOX";
        this.hasWritePermissionOnCurrentlySelectedMailbox = true;
        this.authenticatedUser = "";
        this.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
        this.currentCommand = [];
        this.socketDataHandler = (data) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                switch (lexeme.type) {
                    case (0): {
                        this.currentCommand = [];
                        break;
                    }
                    case (11): {
                        this.writeContinuationRequest("Ready for literal data.");
                        this.currentCommand.push(lexeme);
                        break;
                    }
                    case (12): {
                        this.currentCommand.pop();
                        this.currentCommand.push(lexeme);
                        break;
                    }
                    case (3): {
                        this.executeCommand(this.currentCommand.slice(0));
                        this.currentCommand = [];
                        break;
                    }
                    case (4): {
                        this.currentCommand.push(lexeme);
                        this.executeCommand(this.currentCommand.slice(0));
                        break;
                    }
                    default: {
                        this.currentCommand.push(lexeme);
                    }
                }
            }
        };
        this.socketCloseHandler = (hadError) => {
            this.server.logger.info({
                topic: "imap.socket.close",
                message: `Socket for connection ${this.id} closed.`,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser,
                hadError: hadError
            });
        };
        this.socket.on("data", this.socketDataHandler);
        this.socket.on("close", this.socketCloseHandler);
        this.writeData("OK " + this.server.configuration.imap_server_greeting);
    }
    get socketString() {
        return `${this.socket.remoteFamily}:${this.socket.remoteAddress}:${this.socket.remotePort}`;
    }
    get socketReport() {
        const ret = {};
        for (let property in this.socket) {
            ret[property] = this.socket[property];
        }
        return ret;
    }
    *lexemeStream() {
        while (true) {
            if (this.currentCommand.length > 20) {
                this.scanner.skipLine();
                return;
            }
            if (this.currentCommand.length === 0 && this.scanner.lineReady()) {
                const tag = this.scanner.readTag();
                if (!tag)
                    return;
                this.scanner.readSpace();
                yield tag;
            }
            const lastLexeme = this.currentCommand[this.currentCommand.length - 1];
            if (!lastLexeme)
                return;
            switch (lastLexeme.type) {
                case (5): {
                    if (this.scanner.lineReady()) {
                        const command = this.scanner.readCommand();
                        if (!command)
                            return;
                        yield command;
                        continue;
                    }
                    return;
                }
                case (11): {
                    const literalLength = lastLexeme.toLiteralLength();
                    const literal = this.scanner.readLiteral(literalLength);
                    if (!literal)
                        return;
                    yield literal;
                    continue;
                }
                case (3): {
                    if (this.scanner.lineReady()) {
                        const tag = this.scanner.readTag();
                        if (!tag)
                            return;
                        this.scanner.readSpace();
                        yield tag;
                        continue;
                    }
                    else
                        return;
                }
                case (0): {
                    this.scanner.skipLine();
                    return;
                }
                default: {
                    const commandName = this.currentCommand[1].toString();
                    if (commandName in this.server.commandPlugins) {
                        const commandPlugin = this.server.commandPlugins[commandName];
                        const nextArgument = commandPlugin.argumentsScanner(this.scanner, this.currentCommand).next();
                        if (nextArgument.done)
                            return;
                        yield nextArgument.value;
                    }
                    else {
                        this.scanner.skipLine();
                        yield new Lexeme_1.Lexeme(3, Buffer.from("\r\n"));
                    }
                    continue;
                }
            }
        }
    }
    async executeCommand(lexemes) {
        if (lexemes.length < 2)
            return;
        const tag = lexemes[0].toString();
        const commandName = lexemes[1].toString();
        if (!(commandName in this.server.commandPlugins)) {
            this.writeStatus(tag, "BAD", "ALERT", commandName, "Command not understood by this server.");
            this.server.logger.warn({
                message: `Command '${commandName}' not understood by this server.`,
                topic: "imap.command._unknown",
                command: commandName,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser
            });
            return;
        }
        const commandPlugin = this.server.commandPlugins[commandName];
        if (!(commandPlugin.mayExecuteWhileInConnectionState(this.state))) {
            this.writeStatus(tag, "NO", "ALERT", commandName, "Command not allowed in the current state.");
            this.server.logger.warn({
                message: `Command '${commandName}' not allowed in the current state.`,
                topic: "imap.command._wrongstate",
                command: commandName,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser
            });
            return;
        }
        try {
            const authorized = await this.checkAuthorization(lexemes);
            if (!authorized) {
                this.writeStatus(tag, "NO", "ALERT", commandName, "Not authorized.");
                this.server.logger.warn({
                    message: `Command '${commandName}' not authorized.`,
                    topic: "imap.command._prohibited",
                    command: commandName,
                    socket: this.socket,
                    connectionID: this.id,
                    authenticatedUser: this.authenticatedUser
                });
                return;
            }
        }
        catch (e) {
            this.writeStatus(tag, "NO", "ALERT", commandName, "Internal error.");
            return;
        }
        try {
            await commandPlugin.callback(this, tag, commandName, lexemes);
            this.server.logger.info({
                message: `Command '${commandName}' executed.`,
                topic: `imap.command.${commandName}`,
                command: commandName,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser
            });
        }
        catch (e) {
            this.currentCommand = [];
            this.writeStatus(tag, "OK", "ALERT", commandName, "Error.");
            this.server.logger.error({
                topic: `imap.commands.${commandName}`,
                message: e.message,
                error: e
            });
        }
    }
    async checkAuthorization(lexemes) {
        if (this.server.configuration.simple_authorization)
            return true;
        if (lexemes.length < 2)
            return false;
        const tag = lexemes[0].toString();
        const commandName = lexemes[1].toString();
        if (!(this.server.configuration.imap_server_commands_requiring_authorization.has(commandName)))
            return true;
        const authorization = await this.server.messageBroker.publishAuthorization(this, {
            command: {
                tag: tag,
                name: commandName,
                args: lexemes.slice(2).map((arg) => arg.toString())
            }
        });
        if ("authorized" in authorization && typeof authorization["authorized"] === "boolean") {
            if (authorization["authorized"])
                return true;
            else
                return false;
        }
        else
            throw new Error(`Internal error when trying to authorize command '${commandName}'.`);
    }
    writeStatus(tag, type, code, command, message) {
        if (this.socket.writable) {
            const codeString = ((code.length !== 0) ? ("[" + code + "] ") : "");
            this.socket.write(`${tag} ${type} ${codeString}${command} ${message}\r\n`);
        }
    }
    writeData(message) {
        if (this.socket.writable)
            this.socket.write(`* ${message}\r\n`);
    }
    writeContinuationRequest(message) {
        if (this.socket.writable)
            this.socket.write(`+ ${message}\r\n`);
    }
    writeOk(tag, command) {
        if (this.socket.writable)
            this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
    close() {
        this.socket.end();
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map