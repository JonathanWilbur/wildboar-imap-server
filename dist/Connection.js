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
                        this.executeCommand();
                        this.currentCommand = [];
                        break;
                    }
                    case (4): {
                        this.currentCommand.push(lexeme);
                        this.executeCommand();
                        break;
                    }
                    default: {
                        this.currentCommand.push(lexeme);
                    }
                }
            }
        });
        socket.on("close", (had_error) => {
            server.logger.info({
                topic: "imap.socket.close",
                message: `Socket for connection ${this.id} closed.`,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser
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
            if (this.currentCommand.length === 0 && this.scanner.lineReady())
                yield this.scanner.readTag();
            const lastLexeme = this.currentCommand[this.currentCommand.length - 1];
            if (!lastLexeme)
                return;
            switch (lastLexeme.type) {
                case (5): {
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readCommand();
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
                        yield this.scanner.readTag();
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
    executeCommand() {
        if (this.currentCommand.length < 2)
            return;
        const commandName = this.currentCommand[1].toString();
        if (commandName in this.server.commandPlugins) {
            const commandPlugin = this.server.commandPlugins[commandName];
            try {
                commandPlugin.callback(this, this.currentCommand[0].toString(), this.currentCommand[1].toString(), this.currentCommand);
            }
            catch (e) {
                this.server.logger.error({
                    topic: `imap.commands.${commandName}`,
                    message: e.message,
                    error: e
                });
                this.currentCommand.push(new Lexeme_1.Lexeme(0, Buffer.from(e.message || "")));
            }
        }
        else {
            this.server.logger.warn({
                message: `Command '${commandName}' not understood by this server.`,
                topic: "imap.command._unknown",
                command: commandName,
                socket: this.socket,
                connectionID: this.id,
                authenticatedUser: this.authenticatedUser
            });
        }
    }
    close() {
        this.socket.end();
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map