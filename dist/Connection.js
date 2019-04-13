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
        socket.on("data", (data) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                switch (lexeme.type) {
                    case (0): {
                        this.currentCommand = [];
                        break;
                    }
                    case (11): {
                        this.socket.write("+ Ready for literal data.\r\n");
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
        });
        socket.on("close", (hadError) => {
            server.logger.info({
                topic: "imap.socket.close",
                message: `Socket for connection ${this.id} closed.`,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser,
                hadError: hadError
            });
        });
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
    }
    get socketString() {
        return `${this.socket.remoteFamily}:${this.socket.remoteAddress}:${this.socket.remotePort}`;
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
            this.socket.write(`${tag} BAD Command '${commandName}' not understood by this server.\r\n`);
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
            this.socket.write(`${tag} NO Command '${commandName}' not allowed in the current state.\r\n`);
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
                this.socket.write(`${tag} NO Command '${commandName}' not authorized.\r\n`);
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
            this.socket.write(`${tag} NO Internal error. Sorry!\r\n`);
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
            if (this.socket.writable)
                this.socket.write(`${tag} NO Command '${commandName}' encountered an error.\r\n`);
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
    respond(tag, code, message) {
    }
    close() {
        this.socket.end();
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map