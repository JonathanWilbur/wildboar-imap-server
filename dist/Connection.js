"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Scanner_1 = require("./Scanner");
const uuidv4 = require("uuid/v4");
class Connection {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.default();
        this.expectedLexemeType = 0;
        this.currentlySelectedMailbox = "INBOX";
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data) => {
            console.log(data);
            this.scanner.enqueueData(data);
            let lexeme = null;
            while (true) {
                switch (this.expectedLexemeType) {
                    case (0):
                        lexeme = this.scanner.scanLine();
                        break;
                    case (1):
                        lexeme = this.scanner.scanLine();
                        break;
                }
                if (!lexeme)
                    break;
                if (lexeme.type === 0) {
                    const tag = lexeme.getTag();
                    const command = lexeme.getCommand();
                    const args = lexeme.getArguments();
                    this.dispatchCommand(command, tag, args);
                }
            }
            ;
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
    }
    dispatchCommand(command, tag, args) {
        switch (command.toUpperCase()) {
            case ("CAPABILITY"):
                this.executeCapability(tag);
                break;
            case ("NOOP"):
                this.executeNoop(tag);
                break;
            case ("LOGOUT"):
                this.executeLogout(tag);
                break;
            case ("LOGIN"):
                this.executeLogin(tag, args);
                break;
            case ("LIST"):
                this.executeList(tag, args);
                break;
            case ("LSUB"):
                this.executeList(tag, args);
                break;
            default: {
                console.log("Unrecognized command. Received this:");
                console.log(`TAG: ${tag}`);
                console.log(`COMMAND: ${command}`);
                console.log(`ARGUMENTS: ${args}`);
            }
        }
    }
    executeCapability(tag) {
        this.socket.write(`* CAPABILITY ${this.server.capabilities.join(" ")}\r\n`);
        this.socket.write(`${tag} OK\r\n`);
    }
    executeNoop(tag) {
        this.socket.write(`${tag} OK NOOP Completed.\r\n`);
    }
    executeLogout(tag) {
        this.socket.write("* BYE\r\n");
        this.socket.write(`${tag} OK LOGOUT Completed.\r\n`);
    }
    executeLogin(tag, args) {
        this.socket.write(`${tag} OK LOGIN Completed.\r\n`);
    }
    executeList(tag, args) {
        const listArgs = lexQuoteDelimitedArguments(args);
        if (listArgs.length !== 2)
            throw new Error("Invalid number of arguments given to LIST.");
        const [referenceName, mailboxName] = listArgs;
        if (referenceName === "") {
        }
        if (mailboxName === "") {
            this.socket.write(`* LIST (\Noselect) NIL ""\r\n`);
        }
        else {
            this.socket.write(`* LIST () NIL "INBOX"\r\n`);
        }
        this.socket.write(`${tag} OK LIST Completed.\r\n`);
    }
    executeLsub(tag, args) {
        const listArgs = lexQuoteDelimitedArguments(args);
        if (listArgs.length !== 2)
            throw new Error("Invalid number of arguments given to LSUB.");
        const [referenceName, mailboxName] = listArgs;
        this.socket.write(`${tag} OK LSUB Completed.\r\n`);
    }
}
exports.default = Connection;
function lexQuoteDelimitedArguments(source) {
    let ParsingState;
    (function (ParsingState) {
        ParsingState[ParsingState["UNKNOWN"] = 0] = "UNKNOWN";
        ParsingState[ParsingState["WHITESPACE"] = 1] = "WHITESPACE";
        ParsingState[ParsingState["QUOTED_TEXT"] = 2] = "QUOTED_TEXT";
        ParsingState[ParsingState["ESCAPED_CHAR"] = 3] = "ESCAPED_CHAR";
        ParsingState[ParsingState["UNQUOTED_TEXT"] = 4] = "UNQUOTED_TEXT";
    })(ParsingState || (ParsingState = {}));
    let state = ParsingState.WHITESPACE;
    const args = [];
    let arg = "";
    let i = 0;
    while (i < source.length) {
        switch (state) {
            case (ParsingState.WHITESPACE): {
                if (/\s/.test(source.charAt(i)))
                    break;
                if (source.charAt(i) === "\"") {
                    state = ParsingState.QUOTED_TEXT;
                }
                else {
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
                }
                else {
                    arg += source.charAt(i);
                }
                break;
            }
        }
        i++;
    }
    return args;
}
