import * as net from "net";
import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";
import Scanner from "./Scanner";
import Server from "./Server";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { ConnectionState } from "./ConnectionState";
import { ListItem, ListResponse, LsubItem, LsubResponse, SelectResponse, ExamineResponse, CreateResponse, DeleteResponse, RenameResponse, SubscribeResponse, UnsubscribeResponse } from "./StorageDriverResponses";
// import SASLAuthenticationMechanism from "./SASLAuthenticationMechanism";
// import PlainSASLAuthentication from "./SASLAuthenticationMechanisms/Plain";
const uuidv4 : () => string = require("uuid/v4");

export default
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    private scanner = new Scanner();
    // private expectedLexemeType : LexemeType = LexemeType.COMMAND_LINE;
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
            this.scanner.enqueueData(data);
            let line : Lexeme[] = this.scanner.scanLine();
            console.log(line);
            const tag : string = line[0].token.toString();
            const command : string = line[1].token.toString();
            this.dispatchCommand(command, tag, line.slice(2));
            // let lexeme : Lexeme | null = null;
            // while (true) {
            //     switch (this.expectedLexemeType) {
            //         case (LexemeType.COMMAND_LINE):  lexeme = this.scanner.scanLine(); break;
            //         case (LexemeType.CONTINUATION_LINE):  lexeme = this.scanner.scanLine(); break;
            //         // TODO: Default
            //     }
            //     if (!lexeme) break;
            //     if (lexeme.type === LexemeType.COMMAND_LINE) {
            //         const tag : string = lexeme.getTag();
            //         const command : string = lexeme.getCommand();
            //         const args : string = lexeme.getArguments();
            //         this.dispatchCommand(command, tag, args);
            //     }
            // };
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Bye!`);
        });
    }

    // "It is important that you do not use a callback map, because the map
    // itself will become 'this' in the callbacks." -- Hard experience.
    private dispatchCommand (command : string, tag : string, args : Lexeme[]) : void {
        switch (command.toUpperCase()) {
            case ("CAPABILITY"): this.executeCapability(tag); break;
            case ("NOOP"): this.executeNoop(tag); break;
            case ("LOGOUT"): this.executeLogout(tag); break;
            case ("LOGIN"): this.executeLogin(tag, args); break;
            // case ("LIST"): this.executeList(tag, args); break;
            // case ("LSUB"): this.executeList(tag, args); break;
            case ("SELECT"): this.executeSelect(tag, args); break;
            case ("EXAMINE"): this.executeExamine(tag, args); break;
            case ("CREATE"): this.executeCreate(tag, args); break;
            case ("DELETE"): this.executeDelete(tag, args); break;
            case ("SUBSCRIBE"): this.executeSubscribe(tag, args); break;
            case ("UNSUBSCRIBE"): this.executeUnsubscribe(tag, args); break;
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
        const command : string = "CAPABILITY";
        this.socket.write(`* ${command} ${this.server.capabilities.join(" ")}\r\n`);
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }

    // NOOP
    public executeNoop (tag : string) : void {
        const command : string = "NOOP";
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }

    // LOGOUT
    public executeLogout (tag : string) : void {
        const command : string = "LOGOUT";
        this.socket.write("* BYE\r\n");
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }

    // Not authenticated state:
    // STARTTLS

    // AUTHENTICATE
    // LOGIN
    public executeLogin (tag : string, args : Lexeme[]) : void {
        const command : string = "LOGIN";
        // TODO: Actually implement this.
        // if (args.length === 2)
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }

    // Authenticated state:
    // SELECT
    public executeSelect (tag : string, args : Lexeme[]) : void {
        const command : string = "SELECT";
        // TODO: validate lexemes.
        this.server.messageBroker.select(this.authenticatedUser, args[0].toString())
        .then((response : SelectResponse) : void => {
            this.socket.write(
                `* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag : string) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK ${response.readOnly ? "[READ-ONLY]" : "[READ-WRITE]"} ${command} Completed.\r\n`
            );
        });
    }

    // EXAMINE
    public executeExamine (tag : string, args : Lexeme[]) : void {
        const command : string = "EXAMINE";
        this.server.messageBroker.select(this.authenticatedUser, args[0].toString())
        .then((response : ExamineResponse) : void => {
            this.socket.write(
                `* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag : string) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK [READ-ONLY] ${command} Completed.\r\n`
            );
        });
    }

    // CREATE
    public executeCreate (tag : string, args : Lexeme[]) : void {
        const command : string = "CREATE";
        this.server.messageBroker.create(this.authenticatedUser, args[0].toString())
        .then((response : CreateResponse) : void => {
            if (response.created) this.socket.write(`${tag} OK ${command} Completed.`);
            else this.socket.write(`${tag} NO ${command} Failed.`);
        });
    }

    // DELETE
    public executeDelete (tag : string, args : Lexeme[]) : void {
        const command : string = "DELETE";
        this.server.messageBroker.delete(this.authenticatedUser, args[0].toString())
        .then((response : DeleteResponse) : void => {
            if (response.deleted) this.socket.write(`${tag} OK ${command} Completed.`);
            else this.socket.write(`${tag} NO ${command} Failed.`);
        });
    }

    // RENAME
    public executeRename (tag : string, args : Lexeme[]) : void {
        const command : string = "RENAME";
        this.server.messageBroker.rename(this.authenticatedUser, args[0].toString(), args[1].toString())
        .then((response : RenameResponse) : void => {
            if (response.renamed) this.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }

    // SUBSCRIBE
    public executeSubscribe (tag : string, args : Lexeme[]) : void {
        const command : string = "SUBSCRIBE";
        this.server.messageBroker.subscribe(this.authenticatedUser, args[0].toString())
        .then((response : SubscribeResponse) : void => {
            if (response.subscribed) this.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }

    // UNSUBSCRIBE
    public executeUnsubscribe (tag : string, args : Lexeme[]) : void {
        const command : string = "UNSUBSCRIBE";
        this.server.messageBroker.unsubscribe(this.authenticatedUser, args[0].toString())
        .then((response : UnsubscribeResponse) : void => {
            if (response.unsubscribed) this.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }

    // LIST
    public executeList (tag : string, args : string) : void {
        // const listArgs : string[] = lexQuoteDelimitedArguments(args);
        // if (listArgs.length !== 2)
        //     throw new Error("Invalid number of arguments given to LIST.");

        // // From RFC 3501, Section 6.3.8:
        // // A non-empty reference name argument is the name of a mailbox or a
        // // level of mailbox hierarchy, and indicates the context in which the
        // // mailbox name is interpreted.
        // const [ referenceName, mailboxName ] = listArgs;

        // // // From RFC 3501, Section 6.3.8:
        // // // An empty ("" string) reference name argument indicates that the
        // // // mailbox name is interpreted as by SELECT.
        // // // I don't know what the RFC means by this, but it sounds like it
        // // // means "just use the currently selected mailbox."
        // // // An empty ("" string) mailbox name argument is a special request to
        // // // return the hierarchy delimiter and the root name of the name given
        // // // in the reference.

        // this.server.messageBroker.list(this.authenticatedUser, referenceName, mailboxName)
        // .then((response : ListResponse) : void => {
        //     response.listItems.forEach((listItem : ListItem) : void => {
        //         this.socket.write(`* LIST (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}\r\n`);
        //     });
        //     this.socket.write(`${tag} OK LIST Completed.\r\n`);
        // });
    }

    // LSUB
    public executeLsub (tag : string, args : string) : void {
        // const listArgs : string[] = lexQuoteDelimitedArguments(args);
        // if (listArgs.length !== 2)
        //     throw new Error("Invalid number of arguments given to LSUB.");
        // const [ referenceName, mailboxName ] = listArgs;
        // this.server.messageBroker.lsub(this.authenticatedUser, referenceName, mailboxName)
        // .then((response : LsubResponse) : void => {
        //     response.lsubItems.forEach((lsubItem : LsubItem) : void => {
        //         this.socket.write(`* LSUB (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}\r\n`);
        //     });
        //     this.socket.write(`${tag} OK LSUB Completed.\r\n`);
        // });
    }

    // STATUS
    public executeStatus (tag : string, args : string) : void {
        // const command : string = "STATUS";
        // const argTokens : string[] = lexQuoteDelimitedArguments(args);
        // if (argTokens.length !== 1)
        //     throw new Error(`Invalid number of arguments given to ${command}.`);
        // const [ mailbox ] = argTokens;
        // this.server.messageBroker.subscribe(this.authenticatedUser, mailbox)
        // .then((response : SubscribeResponse) : void => {
        //     if (response.subscribed) this.socket.write(`${tag} OK ${command} Completed.\r\n`);
        //     else this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        // });
    }

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