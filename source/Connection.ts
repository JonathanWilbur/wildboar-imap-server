import * as net from "net";
import { Lexeme } from "./Lexeme";
import { Scanner } from "./Scanner";
import { Server } from "./Server";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { ConnectionState } from "./ConnectionState";
import { CommandPlugin } from "./CommandPlugin";
import { LexemeType } from "./LexemeType";
const uuidv4 : () => string = require("uuid/v4");

export
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly scanner = new Scanner();
    public currentlySelectedMailbox : string = "INBOX";
    public authenticatedUser : string = "";
    public state : ConnectionState = ConnectionState.NOT_AUTHENTICATED;

    public currentCommand : Lexeme[] = [];

    constructor (
        readonly server : Server,
        readonly socket : net.Socket
    ) {
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data : Buffer) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                // console.log(lexeme);
                this.currentCommand.push(lexeme);
                if (lexeme.type === LexemeType.END_OF_COMMAND) {
                    this.executeCommand();
                    this.currentCommand = [];
                } else if (lexeme.type === LexemeType.ERROR) {
                    this.currentCommand = [];
                }
            }
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Bye!`);
        });
    }

    public *lexemeStream () : IterableIterator<Lexeme> {
        while (true) {
            if (this.currentCommand.length > 20) {
                this.scanner.skipLine();
                return;
            }
            if (this.currentCommand.length === 0 && this.scanner.lineReady()) 
                yield this.scanner.readTag();
            const lastLexeme : Lexeme = this.currentCommand[this.currentCommand.length - 1];
            if (!lastLexeme) return;
            switch (<number>lastLexeme.type) {
                case (LexemeType.TAG): {
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readCommand();
                        continue;
                    }
                    return;
                }
                case (LexemeType.LITERAL_LENGTH): {
                    this.socket.write("+ Ready for literal data.\r\n");
                    const literalLength : number = lastLexeme.toLiteralLength();
                    const literal : Lexeme | null = this.scanner.readLiteral(literalLength);
                    if (!literal) return;
                    yield literal;
                    continue;
                }
                case (LexemeType.END_OF_COMMAND): {
                    if (this.scanner.lineReady()) {
                        yield this.scanner.readTag();
                        continue;
                    }
                    return;
                }
                case (LexemeType.ERROR): {
                    this.scanner.skipLine();
                    return;
                }
                default: {
                    const commandName : string = this.currentCommand[1].toString();
                    if (commandName in this.server.commandPlugins) {
                        const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];
                        const nextArgument : IteratorResult<Lexeme> =
                            commandPlugin.argumentsScanner(
                                this.scanner,
                                /**
                                 * We omit literal length indicators from the arguments
                                 * passed into the arguments lexer to simplify lexing.
                                 * This means that string literals can be treated like
                                 * other strings.
                                 */
                                this.currentCommand.filter((lexeme : Lexeme) : boolean => 
                                    (lexeme.type !== LexemeType.LITERAL_LENGTH)
                                )
                            ).next();
                        if (nextArgument.done) return;
                        yield nextArgument.value;
                    } else {
                        // console.log(`Command '${commandName}' not understood ya dingus.`);
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

    public executeCommand () : void {
        const commandName : string = this.currentCommand[1].toString(); // #UTF_SAFE
        if (commandName in this.server.commandPlugins) {
            const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];
            try {
                commandPlugin.callback(
                    this,
                    this.currentCommand[0].toString(), // #UTF_SAFE
                    this.currentCommand[1].toString(), // #UTF_SAFE
                    /**
                     * We omit literal length indicators from the arguments
                     * passed into the command callback to simplify lexing for
                     * the per-command arguments lexer. Literal length
                     * indicators are only of interest in scanning, not in
                     * command execution.
                     */
                    this.currentCommand.filter((lexeme : Lexeme) : boolean => 
                        (lexeme.type !== LexemeType.LITERAL_LENGTH)
                    )
                );
            } catch (e) {
                console.log(e); // TODO: Do some better logging than this.
                this.currentCommand.push(new Lexeme(
                    LexemeType.ERROR,
                    Buffer.from(e.message || "")
                ));
            }
        } else {
            console.log(`Command '${commandName}' not understood.`);
            // TODO: Do something better, such as closing the connection.
        }
    }

    public close () : void {
        this.socket.end();
    }

}