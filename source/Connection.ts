import * as net from "net";
import { Lexeme } from "./Lexeme";
import { Scanner } from "./Scanner";
import { Server } from "./Server";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { ConnectionState } from "./ConnectionState";
import { CommandPlugin } from "./CommandPlugin";
import { EventEmitter } from "events";
import { LexemeType } from "./LexemeType";
const uuidv4 : () => string = require("uuid/v4");

export
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly scanner = new Scanner(this.sendCommandContinuationRequest);
    public currentlySelectedMailbox : string = "INBOX";
    public authenticatedUser : string = "";
    public state : ConnectionState = ConnectionState.NOT_AUTHENTICATED;
    private eventEmitter : EventEmitter = new EventEmitter();

    public currentCommand : Lexeme[] = [];

    constructor (
        readonly server : Server,
        readonly socket : net.Socket
    ) {
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data : Buffer) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                this.currentCommand.push(lexeme);
            }
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Bye!`);
        });
    }

    public *lexemeStream () : IterableIterator<Lexeme> {
        if (this.currentCommand.length === 0 && this.scanner.lineReady()) 
            yield this.scanner.readTag();
        while (true) {
            const lastLexeme : Lexeme = this.currentCommand[this.currentCommand.length - 1];
            console.log(lastLexeme);
            switch (<number>lastLexeme.type) {
                case (LexemeType.TAG): {
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readCommand();
                        continue;
                    }
                    return;
                }
                case (LexemeType.LITERAL_LENGTH): {
                    const literalLength : number = lastLexeme.toLiteralLength();
                    const literal : Lexeme | null = this.scanner.readLiteral(literalLength);
                    if (!literal) return;
                    yield literal;
                    continue;
                }
                case (LexemeType.END_OF_COMMAND): {
                    const commandName : string = this.currentCommand[1].toString();
                    if (commandName in this.server.commandPlugins) {
                        const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];
                        commandPlugin.callback(
                            this,
                            this.currentCommand[0].toString(),
                            this.currentCommand[1].toString(),
                            this.currentCommand.slice(2)
                        );
                    } else {
                        console.log(`Command '${commandName}' not understood.`);
                        // TODO: Do something better, such as closing the connection.
                    }
                    this.currentCommand = [];
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readTag();
                        continue;
                    }
                    return;
                }
                // case (LexemeType.COMMAND_NAME):
                default: {
                    const commandName : string = this.currentCommand[1].toString();
                    console.log(commandName);
                    if (commandName in this.server.commandPlugins) {
                        const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];
                        const nextArgument : IteratorResult<Lexeme> =
                            commandPlugin.argumentsScanner(this.scanner, this.currentCommand).next();
                        if (nextArgument.done) return;
                        yield nextArgument.value;
                    } else {
                        console.log(`Command '${commandName}' not understood ya dingus.`);
                        this.scanner.skipLine();
                        yield new Lexeme(LexemeType.END_OF_COMMAND, Buffer.from("\r\n"));
                        // TODO: Simply read until the next newLine, then report the error.
                        // TODO: Do something better, such as closing the connection.
                    }
                    continue;
                }
            }
        }

    }

    public sendCommandContinuationRequest (message : string) : void {
        this.socket.write(`+ ${message}\r\n`);
    }

    public close () : void {
        this.socket.end();
    }

}