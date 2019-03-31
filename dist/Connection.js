"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
const Scanner_1 = require("./Scanner");
const ConnectionState_1 = require("./ConnectionState");
const uuidv4 = require("uuid/v4");
class Connection {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.Scanner();
        this.currentlySelectedMailbox = "INBOX";
        this.authenticatedUser = "";
        this.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
        this.currentCommand = [];
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                this.currentCommand.push(lexeme);
                if (lexeme.type === 3) {
                    this.executeCommand();
                    this.currentCommand = [];
                }
                else if (lexeme.type === 0) {
                    this.currentCommand = [];
                }
            }
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
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
                case (4): {
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readCommand();
                        continue;
                    }
                    return;
                }
                case (10): {
                    this.socket.write("+ Ready for literal data.\r\n");
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
                        const nextArgument = commandPlugin.argumentsScanner(this.scanner, this.currentCommand.filter((lexeme) => (lexeme.type !== 10))).next();
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
        const commandName = this.currentCommand[1].toString();
        if (commandName in this.server.commandPlugins) {
            const commandPlugin = this.server.commandPlugins[commandName];
            try {
                commandPlugin.callback(this, this.currentCommand[0].toString(), this.currentCommand[1].toString(), this.currentCommand.filter((lexeme) => (lexeme.type !== 10)));
            }
            catch (e) {
                console.log(e);
                this.currentCommand.push(new Lexeme_1.Lexeme(0, Buffer.from(e.message || "")));
            }
        }
        else {
            console.log(`Command '${commandName}' not understood.`);
        }
    }
    close() {
        this.socket.end();
    }
}
exports.Connection = Connection;
