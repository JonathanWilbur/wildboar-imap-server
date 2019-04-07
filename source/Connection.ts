import * as net from "net";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { CommandPlugin } from "./CommandPlugin";
import { ConnectionState } from "./ConnectionState";
import { Lexeme } from "./Lexeme";
import { LexemeType } from "./LexemeType";
import { Scanner } from "./Scanner";
import { Server } from "./Server";
import { v4 as uuidv4 } from "uuid";

export
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly scanner = new Scanner();
    public currentlySelectedMailbox : string = "INBOX";
    public authenticatedUser : string = "";
    public state : ConnectionState = ConnectionState.NOT_AUTHENTICATED;
    public currentCommand : Lexeme[] = [];

    public get socketString () : string {
        return `${this.socket.remoteFamily}:${this.socket.remoteAddress}:${this.socket.remotePort}`;
    }

    constructor (
        readonly server : Server,
        readonly socket : net.Socket
    ) {
        socket.on("data", (data : Buffer) => {
            this.scanner.enqueueData(data);
            for (let lexeme of this.lexemeStream()) {
                switch (<number>lexeme.type) {
                    case (LexemeType.ERROR): {
                        this.currentCommand = [];
                        break;
                    }
                    case (LexemeType.LITERAL_LENGTH): {
                        this.socket.write("+ Ready for literal data.\r\n");
                        this.currentCommand.push(lexeme);
                        break;
                    }
                    case (LexemeType.STRING_LITERAL): {
                        /**
                         * We remove the literal length indicator entirely.
                         * Since it ALWAYS comes before the literal and serves
                         * no other purpose than indicating the length of the
                         * literal, which can be obtained from the literal
                         * lexeme itself, it is useless at this point.
                         * 
                         * The advantage of doing this is simplicity: if there
                         * are a fixed number of arguments expected in a
                         * command that accepts literals, the number of lexemes
                         * passed to the command plugin's callback can be used
                         * directly, rather than a complicated scheme to
                         * determine how many arguments have been received.
                         * Every lexeme after [0] and [1] are arguments, and
                         * each argument is represented on only a single
                         * lexeme. This greatly simplifies the per-command
                         * argument lexing.
                         */
                        this.currentCommand.pop();
                        this.currentCommand.push(lexeme);
                        break;
                    }
                    case (LexemeType.END_OF_COMMAND): {
                        this.executeCommand();
                        this.currentCommand = [];
                        break;
                    }
                    case (LexemeType.NEWLINE): {
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

        socket.on("close", (had_error : boolean) : void => {
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

    /**
     * Returns lexemes from the client. This does nothing more than breaking
     * the stream of raw bytes into lexemes.
     * 
     * @summary Yields lexemes from the network stream.
     * @yields {Lexeme}
     * @private
     */
    private *lexemeStream () : IterableIterator<Lexeme> {
        while (true) {
            if (this.currentCommand.length > 20) {
                this.scanner.skipLine();
                return;
            }
            if (this.currentCommand.length === 0 && this.scanner.lineReady()) {
                const tag : Lexeme | null = this.scanner.readTag();
                if (!tag) return;
                yield tag;
            }
            const lastLexeme : Lexeme = this.currentCommand[this.currentCommand.length - 1];
            if (!lastLexeme) return;
            switch (<number>lastLexeme.type) {
                case (LexemeType.TAG): {
                    if (this.scanner.lineReady()) {
                        const command : Lexeme | null = this.scanner.readCommand();
                        if (!command) return;
                        yield command;
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
                    if (this.scanner.lineReady()) {
                        const tag : Lexeme | null = this.scanner.readTag();
                        if (!tag) return;
                        yield tag;
                        continue;
                    } else return;
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
                            commandPlugin.argumentsScanner(this.scanner, this.currentCommand).next();
                        if (nextArgument.done) return;
                        yield nextArgument.value;
                    } else {
                        /*
                            It is unnecessary to do anything more than skip the
                            line and yield an `END_OF_COMMAND` Lexeme, because
                            the actual "command not understood" functionality
                            should be handled by `executeCommand()`.
                        */
                        this.scanner.skipLine();
                        yield new Lexeme(LexemeType.END_OF_COMMAND, Buffer.from("\r\n"));
                    }
                    continue;
                }
            }
        }
    }

    /**
     * Executes the current command. It does by looking up the command plugin
     * by name, then executing the callback associated with that plugin, if
     * the plugin can be found.
     * 
     * @summary Executes the current command plugin's callback.
     * @private
     */
    private executeCommand () : void {
        if (this.currentCommand.length < 2) return;
        const commandName : string = this.currentCommand[1].toString(); // #UTF_SAFE
        if (commandName in this.server.commandPlugins) {
            const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];
            try {
                commandPlugin.callback(
                    this,
                    this.currentCommand[0].toString(), // #UTF_SAFE
                    this.currentCommand[1].toString(), // #UTF_SAFE
                    this.currentCommand
                );
            } catch (e) {
                this.server.logger.error({
                    topic: `imap.commands.${commandName}`,
                    message: e.message,
                    error: e
                });
                this.currentCommand.push(new Lexeme(
                    LexemeType.ERROR,
                    Buffer.from(e.message || "")
                ));
            }
        } else {
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

    public close () : void {
        this.socket.end();
    }

}