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
        this.useUID = false;
        this.socketCloseHandler = (hadError) => {
            this.server.logger.info({
                topic: "tcp.close",
                message: `Socket for IMAP connection ${this.id} closed.`,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser,
                hadError: hadError,
                applicationLayerProtocol: "IMAP"
            });
        };
        this.socketDataHandler = (data) => {
            this.scanner.enqueueData(data);
            try {
                for (let lexeme of this.lexemeStream()) {
                    this.respondToLexeme(lexeme);
                }
            }
            catch (e) {
                this.writeData("BAD Closing connection.");
                this.close();
            }
        };
        this.socketErrorHandler = (e) => {
            this.server.logger.error({
                topic: "tcp.error",
                message: e.message,
                error: e,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser,
                applicationLayerProtocol: "IMAP"
            });
        };
        this.socketTimeoutHandler = () => {
            this.writeData("BYE TCP Socket timed out.");
            this.close();
            this.server.logger.warn({
                message: `TCP Socket for IMAP connection ${this.id} timed out.`,
                topic: "tcp.timeout",
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser,
                applicationLayerProtocol: "IMAP"
            });
        };
        this.socket.setTimeout(this.server.configuration.imap_server_tcp_socket_timeout_in_milliseconds);
        this.socket.on("close", this.socketCloseHandler);
        this.socket.on("data", this.socketDataHandler);
        this.socket.on("error", this.socketErrorHandler);
        this.socket.on("timeout", this.socketTimeoutHandler);
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
    respondToLexeme(lexeme) {
        switch (lexeme.type) {
            case (10): {
                this.writeContinuationRequest("Ready for literal data.");
                this.currentCommand.push(lexeme);
                break;
            }
            case (11): {
                this.currentCommand.pop();
                this.currentCommand.push(lexeme);
                break;
            }
            case (2): {
                this.executeCommand(this.currentCommand.slice(0));
                this.currentCommand = [];
                break;
            }
            case (3): {
                this.currentCommand.push(lexeme);
                this.executeCommand(this.currentCommand.slice(0));
                break;
            }
            default: {
                this.currentCommand.push(lexeme);
            }
        }
    }
    *lexemeStream() {
        if (this.currentCommand.length > 20) {
            this.scanner.skipLine();
            return;
        }
        if (!this.scanner.lineReady()) {
            return;
        }
        if (this.currentCommand.length === 0) {
            const tag = this.scanner.readTag();
            if (!tag)
                return;
            this.scanner.readSpace();
            yield tag;
        }
        if (this.currentCommand.length <= 1) {
            const command = this.scanner.readCommand();
            if (!command)
                return;
            if (command.toString().toUpperCase() === "UID") {
                this.scanner.readSpace();
                const command2 = this.scanner.readCommand();
                if (!command2)
                    return;
                this.useUID = true;
                yield command2;
            }
            else {
                yield command;
            }
        }
        const lastLexeme = this.currentCommand[this.currentCommand.length - 1];
        if (lastLexeme.type === 10) {
            const literal = this.scanner.readLiteral(lastLexeme.toLiteralLength());
            if (!literal)
                return;
            yield literal;
        }
        const tag = this.currentCommand[0].toString();
        const commandName = this.currentCommand[1].toString();
        if (commandName in this.server.commandPlugins) {
            const commandPlugin = this.server.commandPlugins[commandName];
            try {
                yield* commandPlugin.argumentsScanner(this.scanner, this.currentCommand);
            }
            catch (e) {
                this.writeStatus(tag, "BAD", "ALERT", commandName, "Bad arguments.");
                this.server.logger.error({
                    topic: "command.error",
                    message: e.message,
                    error: e,
                    socket: this.socket,
                    connectionID: this.id,
                    authenticatedUser: this.authenticatedUser,
                    applicationLayerProtocol: "IMAP"
                });
                this.scanner.skipLine();
                this.currentCommand = [];
                return;
            }
        }
        else {
            this.scanner.skipLine();
            yield new Lexeme_1.Lexeme(2, Buffer.from("\r\n"));
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
        finally {
            this.useUID = false;
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