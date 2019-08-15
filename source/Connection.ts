import * as net from "net";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { CommandPlugin } from "./CommandPlugin";
import { ConnectionState } from "./ConnectionState";
import { Lexeme } from "./Lexeme";
import { LexemeType } from "./LexemeType";
import { Scanner } from "./Scanner";
import { Server } from "./Server";
import { SocketWriter } from "./SocketWriter";
import { v4 as uuidv4 } from "uuid";

export
class Connection implements SocketWriter, Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly scanner = new Scanner();
    public currentlySelectedMailbox : string = "INBOX";
    public hasWritePermissionOnCurrentlySelectedMailbox : boolean = true;
    public authenticatedUser : string = "";
    public state : ConnectionState = ConnectionState.NOT_AUTHENTICATED;
    public currentCommand : Lexeme[] = [];
    public useUID : boolean = false;

    public get socketString () : string {
        return `${this.socket.remoteFamily}:${this.socket.remoteAddress}:${this.socket.remotePort}`;
    }

    public get socketReport () {
        const ret : object = {};
        for (let property in this.socket) {
            (<any>ret)[property] = (<any>this.socket)[property];
        }
        return ret;
    }

    constructor (
        readonly server : Server,
        private readonly socket : net.Socket
    ) {
        this.socket.setTimeout(this.server.configuration.imap_server_tcp_socket_timeout_in_milliseconds);
        this.socket.on("close", this.socketCloseHandler);
        this.socket.on("data", this.socketDataHandler);
        // "end" not used.
        this.socket.on("error", this.socketErrorHandler);
        this.socket.on("timeout", this.socketTimeoutHandler);
        this.server.connections.add(this);
        this.writeData("OK " + this.server.configuration.imap_server_greeting);
    }

    private socketCloseHandler = (hadError : boolean) : void => {
        this.server.connections.delete(this);
        this.server.logger.info({
            topic: "tcp.close",
            message: `Socket for IMAP connection ${this.id} closed.`,
            socket: this.socket,
            connectionID: this.id,
            authenticatedUser: this.authenticatedUser,
            hadError: hadError,
            applicationLayerProtocol: "IMAP"
        });
    }

    private socketDataHandler = (data : Buffer) : void => {
        this.scanner.enqueueData(data);
        try {
            for (let lexeme of this.lexemeStream()) {
                this.respondToLexeme(lexeme);
            }
        } catch (e) {
            this.writeData("BAD Closing connection.");
            this.close();
        }
    }

    private socketErrorHandler = (e : Error) : void => {
        this.server.logger.error({
            topic: "tcp.error",
            message: e.message,
            error: e,
            socket: this.socket,
            connectionID: this.id,
            authenticatedUser: this.authenticatedUser,
            applicationLayerProtocol: "IMAP"
        });
        // The socket is automatically closed after encountering an error.
    };

    private socketTimeoutHandler = () => {
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

    private respondToLexeme (lexeme : Lexeme) : void {
        switch (<number>lexeme.type) {
            case (LexemeType.LITERAL_LENGTH): {
                this.writeContinuationRequest("Ready for literal data.");
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
                this.executeCommand(this.currentCommand.slice(0));
                this.currentCommand = [];
                break;
            }
            // REVIEW: Why does this also executeCommand()?
            case (LexemeType.NEWLINE): {
                this.currentCommand.push(lexeme);
                this.executeCommand(this.currentCommand.slice(0));
                break;
            }
            default: {
                this.currentCommand.push(lexeme);
            }
        }
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
        if (this.currentCommand.length > 20) {
            this.scanner.skipLine();
            return;
        }
        if (!this.scanner.lineReady()) {
            return;
        }
        if (this.currentCommand.length === 0) {
            let tag : Lexeme | null = null;
            /**
             * This try-catch block allows us to ignore blank lines in the
             * stream.
             */
            try {
                tag = this.scanner.readTag();
            } catch (e) {
                this.scanner.skipLine();
            }
            if (!tag) return;
            this.scanner.readSpace();
            yield tag;
        }
        if (this.currentCommand.length <= 1) {
            const command : Lexeme | null = this.scanner.readCommand();
            if (!command) return;
            /**
             * This is the one exception where I discriminate against commands
             * in the Connection logic, and I only do so because UID just uses
             * other commands behind the scenes and because I don't expect to
             * ever have to do this again with any other command.
             */
            if (command.toString().toUpperCase() === "UID") {
                this.scanner.readSpace();
                const command2 : Lexeme | null = this.scanner.readCommand();
                if (!command2) return;
                this.useUID = true;
                yield command2;
            } else {
                yield command;
            }
        }

        const lastLexeme : Lexeme = this.currentCommand[this.currentCommand.length - 1];
        if (lastLexeme.type === LexemeType.LITERAL_LENGTH) {
            const literal : Lexeme | null = this.scanner.readLiteral(lastLexeme.toLiteralLength());
            if (!literal) return;
            yield literal;
        }

        const tag : string = this.currentCommand[0].toString(); // #UTF_SAFE
        const commandName : string = this.currentCommand[1].toString(); // #UTF_SAFE
        if (commandName in this.server.commandPlugins) {
            const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];
            try {
                yield* commandPlugin.argumentsScanner(this.scanner, this.currentCommand);
            } catch (e) {
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
    }

    /**
     * Executes the current command. It does by looking up the command plugin
     * by name, then executing the callback associated with that plugin, if
     * the plugin can be found.
     * 
     * @summary Executes the current command plugin's callback.
     * @private
     */
    private async executeCommand (lexemes : Lexeme[]) {
        if (lexemes.length < 2) return;
        const tag : string = lexemes[0].toString(); // #UTF_SAFE
        const commandName : string = lexemes[1].toString(); // #UTF_SAFE

        // Check that the command exists
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
        const commandPlugin : CommandPlugin = this.server.commandPlugins[commandName];

        // Check that the command may be executed in this state.
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

        // Check that this command is authorized.
        try {
            const authorized : boolean = await this.checkAuthorization(lexemes);
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
        } catch (e) {
            this.writeStatus(tag, "NO", "ALERT", commandName, "Internal error.");
            return;
        }

        // Finally, execute the command.
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
        } catch (e) {
            this.currentCommand = [];
            this.writeStatus(tag, "OK", "ALERT", commandName, "Error.");
            this.server.logger.error({
                topic: `imap.commands.${commandName}`,
                message: e.message,
                error: e
            });
        } finally {
            this.useUID = false;
        }
    }

    private async checkAuthorization (lexemes : Lexeme[]) : Promise<boolean> {
        if (this.server.configuration.simple_authorization) return true;
        if (lexemes.length < 2) return false;
        const tag : string = lexemes[0].toString(); // #UTF_SAFE
        const commandName : string = lexemes[1].toString(); // #UTF_SAFE
        if (!(this.server.configuration.imap_server_commands_requiring_authorization.has(commandName)))
            return true;
        const authorization : object =
            await this.server.messageBroker.publishAuthorization(this, {
                command: {
                    tag: tag,
                    name: commandName,
                    args: lexemes.slice(2).map((arg : Lexeme) => arg.toString())
                }
            });
        if ("authorized" in authorization && typeof (<any>authorization)["authorized"] === "boolean") {
            if ((<any>authorization)["authorized"]) return true;
            else return false;
        } else
            throw new Error(`Internal error when trying to authorize command '${commandName}'.`);
    }

    /*
        From RFC 3501, Section 7:
        Server responses are in three forms: status responses, server data,
        and command continuation request. 
    */

    public writeStatus (tag : string, type : string, code : string, command : string, message : string) : void {
        if (this.socket.writable) {
            const codeString : string = ((code.length !== 0) ? ("[" + code + "] ") : "");
            this.socket.write(`${tag} ${type} ${codeString}${command} ${message}\r\n`);
        }
    }

    public writeData (message : string) : void {
        if (this.socket.writable) this.socket.write(`* ${message}\r\n`);
    }

    public writeContinuationRequest (message : string) : void {
        if (this.socket.writable) this.socket.write(`+ ${message}\r\n`);
    }

    public writeOk (tag : string, command : string) : void {
        if (this.socket.writable) this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }

    public close () : void {
        this.socket.end();
    }

}