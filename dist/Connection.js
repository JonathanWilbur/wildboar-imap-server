"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
const Scanner_1 = require("./Scanner");
const ConnectionState_1 = require("./ConnectionState");
const events_1 = require("events");
const uuidv4 = require("uuid/v4");
class Connection {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.Scanner(this.sendCommandContinuationRequest);
        this.currentlySelectedMailbox = "INBOX";
        this.authenticatedUser = "";
        this.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
        this.eventEmitter = new events_1.EventEmitter();
        this.currentCommand = [];
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                this.currentCommand.push(lexeme);
            }
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
    }
    *lexemeStream() {
        if (this.currentCommand.length === 0 && this.scanner.lineReady())
            yield this.scanner.readTag();
        while (true) {
            const lastLexeme = this.currentCommand[this.currentCommand.length - 1];
            console.log(lastLexeme);
            switch (lastLexeme.type) {
                case (4): {
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readCommand();
                        continue;
                    }
                    return;
                }
                case (10): {
                    const literalLength = lastLexeme.toLiteralLength();
                    const literal = this.scanner.readLiteral(literalLength);
                    if (!literal)
                        return;
                    yield literal;
                    continue;
                }
                case (3): {
                    const commandName = this.currentCommand[1].toString();
                    if (commandName in this.server.commandPlugins) {
                        const commandPlugin = this.server.commandPlugins[commandName];
                        commandPlugin.callback(this, this.currentCommand[0].toString(), this.currentCommand[1].toString(), this.currentCommand.slice(2));
                    }
                    else {
                        console.log(`Command '${commandName}' not understood.`);
                    }
                    this.currentCommand = [];
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readTag();
                        continue;
                    }
                    return;
                }
                default: {
                    const commandName = this.currentCommand[1].toString();
                    console.log(commandName);
                    if (commandName in this.server.commandPlugins) {
                        const commandPlugin = this.server.commandPlugins[commandName];
                        const nextArgument = commandPlugin.argumentsScanner(this.scanner, this.currentCommand).next();
                        if (nextArgument.done)
                            return;
                        yield nextArgument.value;
                    }
                    else {
                        console.log(`Command '${commandName}' not understood ya dingus.`);
                        this.scanner.skipLine();
                        yield new Lexeme_1.Lexeme(3, Buffer.from("\r\n"));
                    }
                    continue;
                }
            }
        }
    }
    sendCommandContinuationRequest(message) {
        this.socket.write(`+ ${message}\r\n`);
    }
    close() {
        this.socket.end();
    }
}
exports.Connection = Connection;
