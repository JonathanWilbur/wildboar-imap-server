import * as net from "net";
import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";
import Scanner from "./Scanner";
import Server from "./Server";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { ConnectionState } from "./ConnectionState";
import { ListItem, ListResponse, LsubItem, LsubResponse, SelectResponse } from "./StorageDriverResponses";
// import SASLAuthenticationMechanism from "./SASLAuthenticationMechanism";
// import PlainSASLAuthentication from "./SASLAuthenticationMechanisms/Plain";
const uuidv4 : () => string = require("uuid/v4");

export default
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    private scanner = new Scanner();
    private expectedLexemeType : LexemeType = LexemeType.COMMAND_LINE;
    // private saslAuthenticationMechanism : string = "";
    // private saslAuthenticator : SASLAuthenticationMechanism | undefined;
    private currentlySelectedMailbox : string = "INBOX";
    private authenticatedUser : string = "";
    private state : ConnectionState = ConnectionState.NOT_AUTHENTICATED;

    constructor (
        readonly server : Server,
        readonly socket : net.Socket
    ) {
        // this.respond(220, this.server.configuration.smtp_server_greeting);
        // greeting        = "*" SP (resp-cond-auth / resp-cond-bye) CRLF
        // resp-cond-auth  = ("OK" / "PREAUTH") SP resp-text ; Authentication condition
        // resp-cond-bye   = "BYE" SP resp-text
        // resp-text       = ["[" resp-text-code "]" SP] text
        // resp-text-code  = "ALERT" /
        //     "BADCHARSET" [SP "(" astring *(SP astring) ")" ] /
        //     capability-data / "PARSE" /
        //     "PERMANENTFLAGS" SP "("
        //     [flag-perm *(SP flag-perm)] ")" /
        //     "READ-ONLY" / "READ-WRITE" / "TRYCREATE" /
        //     "UIDNEXT" SP nz-number / "UIDVALIDITY" SP nz-number /
        //     "UNSEEN" SP nz-number /
        //     atom [SP 1*<any TEXT-CHAR except "]">]
        // text            = 1*TEXT-CHAR
        // TEXT-CHAR       = <any CHAR except CR and LF>
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data : Buffer) : void => {
            console.log(data);
            this.scanner.enqueueData(data);
            let lexeme : Lexeme | null = null;
            while (true) {
                switch (this.expectedLexemeType) {
                    case (LexemeType.COMMAND_LINE):  lexeme = this.scanner.scanLine(); break;
                    case (LexemeType.CONTINUATION_LINE):  lexeme = this.scanner.scanLine(); break;
                    // TODO: Default
                }
                if (!lexeme) break;
                if (lexeme.type === LexemeType.COMMAND_LINE) {
                    const tag : string = lexeme.getTag();
                    const command : string = lexeme.getCommand();
                    const args : string = lexeme.getArguments();
                    this.dispatchCommand(command, tag, args);
                }
            };
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Bye!`);
        });
    }

    // A non-empty `tag` is used to indicate completion of the command.
    // private respond (text : string = "", tag : string = "", result : string = "") : void {

    //     if (text.length === 0) {
    //         this.socket.write(`${tag} ${result}\r\n`);
    //         return;
    //     }

    //     const lines : string[] = text.split("\r\n");
    //     const complete : boolean = (tag.length !== 0);

    //     if (lines.length === 1) {
    //         if (complete)
    //             this.socket.write(`${tag} ${result} ${text}\r\n`);
    //         else
    //             this.socket.write(`+ ${text}\r\n`);
    //         return;
    //     }

    //     let responseLines : string[] = [];
    //     if (complete)
    //         responseLines = lines.slice(0, -1).map((line : string) => `+ ${line}`);
    //     else
    //         responseLines = lines.slice(0, -1).map((line : string) => `* ${line}`);

    //     const terminalLine : string = `${tag} ${result} ${lines[lines.length - 1]}`;
    //     responseLines.push(terminalLine);
    //     this.socket.write(responseLines.join("\r\n"));
    // }

    // "It is important that you do not use a callback map, because the map
    // itself will become 'this' in the callbacks." -- Hard experience.
    private dispatchCommand (command : string, tag : string, args : string) : void {
        switch (command.toUpperCase()) {
            case ("CAPABILITY"): this.executeCapability(tag); break;
            case ("NOOP"): this.executeNoop(tag); break;
            case ("LOGOUT"): this.executeLogout(tag); break;
            case ("LOGIN"): this.executeLogin(tag, args); break;
            case ("LIST"): this.executeList(tag, args); break;
            case ("LSUB"): this.executeList(tag, args); break;
            case ("SELECT"): this.executeSelect(tag, args); break;
            case ("CREATE"): this.executeCreate(tag, args); break;
            default: {
                console.log("Unrecognized command. Received this:");
                console.log(`TAG: ${tag}`);
                console.log(`COMMAND: ${command}`);
                console.log(`ARGUMENTS: ${args}`);
                // this.respond(504, `Command '${command}' not implemented.`);
            }
        }
    }

    // Individual command handlers go below here.

    // CAPABILITY
    public executeCapability (tag : string) : void {
        this.socket.write(`* CAPABILITY ${this.server.capabilities.join(" ")}\r\n`);
        this.socket.write(`${tag} OK\r\n`);
    }

    // NOOP
    public executeNoop (tag : string) : void {
        this.socket.write(`${tag} OK NOOP Completed.\r\n`);
    }

    // LOGOUT
    public executeLogout (tag : string) : void {
        this.socket.write("* BYE\r\n");
        this.socket.write(`${tag} OK LOGOUT Completed.\r\n`);
    }

    // Not authenticated state:
    // STARTTLS

    // AUTHENTICATE
    // LOGIN
    public executeLogin (tag : string, args : string) : void {
        // TODO: Actually implement this.
        this.socket.write(`${tag} OK LOGIN Completed.\r\n`);
    }

    // Authenticated state:
    // SELECT
    public executeSelect (tag : string, args : string) : void {
        const mailboxName : string = args.trim();
        this.server.messageBroker.select(this.authenticatedUser, mailboxName)
        .then((response : SelectResponse) : void => {
            this.socket.write(
                `* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag : string) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK [READ-WRITE] SELECT Completed.\r\n`
            );
        });
    }

    // EXAMINE

    // CREATE
    public executeCreate (tag : string, args : string) : void {
        this.socket.write(`${tag} OK CREATE Completed.\r\n`);
    }

    // DELETE
    // RENAME
    // SUBSCRIBE
    // UNSUBSCRIBE

    // LIST
    public executeList (tag : string, args : string) : void {
        const listArgs : string[] = lexQuoteDelimitedArguments(args);
        if (listArgs.length !== 2)
            throw new Error("Invalid number of arguments given to LIST.");

        // From RFC 3501, Section 6.3.8:
        // A non-empty reference name argument is the name of a mailbox or a
        // level of mailbox hierarchy, and indicates the context in which the
        // mailbox name is interpreted.
        const [ referenceName, mailboxName ] = listArgs;

        // // From RFC 3501, Section 6.3.8:
        // // An empty ("" string) reference name argument indicates that the
        // // mailbox name is interpreted as by SELECT.
        // // I don't know what the RFC means by this, but it sounds like it
        // // means "just use the currently selected mailbox."
        // // An empty ("" string) mailbox name argument is a special request to
        // // return the hierarchy delimiter and the root name of the name given
        // // in the reference.

        this.server.messageBroker.list(this.authenticatedUser, referenceName, mailboxName)
        .then((response : ListResponse) : void => {
            response.listItems.forEach((listItem : ListItem) : void => {
                this.socket.write(`* LIST (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}\r\n`);
            });
            this.socket.write(`${tag} OK LIST Completed.\r\n`);
        });
    }

    // LSUB
    public executeLsub (tag : string, args : string) : void {
        const listArgs : string[] = lexQuoteDelimitedArguments(args);
        if (listArgs.length !== 2)
            throw new Error("Invalid number of arguments given to LSUB.");
        const [ referenceName, mailboxName ] = listArgs;
        this.server.messageBroker.lsub(this.authenticatedUser, referenceName, mailboxName)
        .then((response : LsubResponse) : void => {
            response.lsubItems.forEach((lsubItem : LsubItem) : void => {
                this.socket.write(`* LSUB (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}\r\n`);
            });
            this.socket.write(`${tag} OK LSUB Completed.\r\n`);
        });
    }

    // STATUS
    // APPEND

    // Selected state:
    // CHECK
    // CLOSE
    // EXPUNGE
    // SEARCH
    // FETCH
    // STORE
    // COPY
    // UID

}

function lexQuoteDelimitedArguments (source : string) : string[] {

    enum ParsingState {
        UNKNOWN = 0,
        WHITESPACE = 1,
        QUOTED_TEXT = 2,
        ESCAPED_CHAR = 3,
        UNQUOTED_TEXT = 4
    }

    let state : ParsingState = ParsingState.WHITESPACE;
    const args : string[] = [];
    let arg : string = "";
    let i : number = 0;
    while (i < source.length) {
        switch (<number>state) {
            case (ParsingState.WHITESPACE): {
                if (/\s/.test(source.charAt(i))) break;
                if (source.charAt(i) === "\"") {
                    state = ParsingState.QUOTED_TEXT;
                } else {
                    state = ParsingState.UNQUOTED_TEXT;
                }
                break;
            }
            case (ParsingState.QUOTED_TEXT): {
                if (source.charAt(i) === "\\") {
                    state = ParsingState.ESCAPED_CHAR;
                    break;
                }
                if (source.charAt(i) === "\"") {
                    state = ParsingState.WHITESPACE;
                    args.push(arg);
                    arg = "";
                    break;
                }
                arg += source.charAt(i);
                break;
            }
            case (ParsingState.ESCAPED_CHAR): {
                arg += source.charAt(i);
                state = ParsingState.QUOTED_TEXT;
                break;
            }
            case (ParsingState.UNQUOTED_TEXT): {
                if (/\s/.test(source.charAt(i))) {
                    args.push(arg);
                    arg = "";
                    state = ParsingState.WHITESPACE;
                } else {
                    arg += source.charAt(i);
                }
                break;
            }
        }
        i++;
    }

    return args;
}