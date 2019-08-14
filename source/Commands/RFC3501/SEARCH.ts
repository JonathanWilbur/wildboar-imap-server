import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
import { Scanner } from "../../Scanner";
import * as Ajv from "ajv";
import { LexemeType } from "../../LexemeType";
// import { schema } from "../../ResponseSchema/LSUB";

/* TODO:
    Consider putting the lexing in the scanner, since you're not really doing
    any semantic validation here, and putting it in the scanner may give you
    more control.

    On the other hand, that may not be a good idea, because the entire search
    query will return as a single SEARCH_KEY lexeme, instead of a sequence of
    lexemes. It still may be worth the experiment.
*/

// TODO: Figure out how to parse search-key = sequence-set
// TODO: Figure out how to parse search-key = "(" search-key *(SP search-key) ")"
// TODO: Create skipSpace() and use it.

// const ajv : Ajv.Ajv = new Ajv();
// const validate = ajv.compile(schema);

// search          = "SEARCH" [SP "CHARSET" SP astring] 1*(SP search-key)
//                     ; CHARSET argument to MUST be registered with IANA

// search-key      = "ALL" / "ANSWERED" / "BCC" SP astring /
//                   "BEFORE" SP date / "BODY" SP astring /
//                   "CC" SP astring / "DELETED" / "FLAGGED" /
//                   "FROM" SP astring / "KEYWORD" SP flag-keyword /
//                   "NEW" / "OLD" / "ON" SP date / "RECENT" / "SEEN" /
//                   "SINCE" SP date / "SUBJECT" SP astring /
//                   "TEXT" SP astring / "TO" SP astring /
//                   "UNANSWERED" / "UNDELETED" / "UNFLAGGED" /
//                   "UNKEYWORD" SP flag-keyword / "UNSEEN" /
//                     ; Above this line were in [IMAP2]
//                   "DRAFT" / "HEADER" SP header-fld-name SP astring /
//                   "LARGER" SP number / "NOT" SP search-key /
//                   "OR" SP search-key SP search-key /
//                   "SENTBEFORE" SP date / "SENTON" SP date /
//                   "SENTSINCE" SP date / "SMALLER" SP number /
//                   "UID" SP sequence-set / "UNDRAFT" / sequence-set /
//                   "(" search-key *(SP search-key) ")"

function currentSearchKey (currentCommand : Lexeme[]) : Lexeme[] {
    for (let i : number = currentCommand.length - 1; i > 0; i--) {
        if (currentCommand[i].type === LexemeType.SEARCH_KEY) {
            return currentCommand.slice(i);
        }
    }
    return currentCommand;
}

const nullLexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    return;
}

const uidLexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    scanner.readSpace();
    const uid : Lexeme | null = scanner.readSequenceSet();
    if (!uid) return;
    yield uid;
}

// TODO: template this (lengthOfCommand, readCommand)
// "HEADER" SP header-fld-name SP astring
const headerLexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    while (currentSearchKey(currentCommand).length < 5) {
        switch (currentCommand[currentCommand.length - 1].type) {
            case (LexemeType.WHITESPACE): {
                const astr : Lexeme | null = scanner.readAstring();
                if (!astr) return;
                yield astr;
            }
            default: {
                let space : Lexeme | null = null;
                try {
                    space = scanner.readSpace();
                } catch (e) {
                    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
                    if (!newline) return;
                    yield newline;
                    return;
                }
                if (!space) return;
                yield space;
            }
        }
    }
}

const lexMap: Map<string, (scanner : Scanner, currentCommand : Lexeme[]) => IterableIterator<Lexeme>> = new Map([
    ["ALL", nullLexer],
    ["UID", uidLexer],
    ["HEADER", headerLexer],
]);

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    const lastLexeme: Lexeme = currentCommand[currentCommand.length - 1];
    do {
        switch (lastLexeme.type) {
            case (LexemeType.COMMAND_NAME): {
                const space : Lexeme | null = scanner.readSpace();
                if (!space) return;
                yield space;
            }
            case (LexemeType.WHITESPACE): {
                let key : Lexeme | null = null;
                key = scanner.readSearchKey();
                if (!key) return;
                yield key;
            }
            case (LexemeType.SEARCH_KEY): {
                const searchKey : string = currentCommand[currentCommand.length - 1].toString().toUpperCase();
                const keyLexer = lexMap.get(searchKey);
                if (!keyLexer) {
                    throw new Error(`Cannot understand search key '${searchKey}'.`);
                }
                yield* keyLexer(scanner, currentCommand);
                // break; NOTE: You intentionally do not want to break here.
            }
            default: {
                let space : Lexeme | null = null;
                try {
                    space = scanner.readSpace();
                } catch (e) {
                    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
                    if (!newline) return;
                    yield newline;
                    return;
                }
                if (!space) return;
                yield space;
            }
        }
    } while (true);
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    lexemes.forEach((lex: Lexeme): void => {
        connection.writeData(`SEARCH ${lex.toString()}`);
    });
    connection.writeOk(tag, command);
    // if (lexemes.length !== 6) {
    //     connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
    //     return;
    // }
    // const mailboxName : string = lexemes[3].toString();
    // const response : object =
    //     await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
    //         mailboxName: mailboxName
    //     });
    // try {
    //     // await validate(response);
    //     (<any[]>(<any>response)["lsubItems"]).forEach((lsubItem : any) : void => {
    //         connection.writeData(`LSUB (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}`);
    //     });
    //     connection.writeOk(tag, command);
    // } catch (e) {
    //     connection.writeStatus(tag, "NO", "", command, "Failed.");
    //     connection.server.logger.error({
    //         topic: "imap.json",
    //         message: e.message,
    //         error: e,
    //         command: command,
    //         socket: connection.socketReport,
    //         connectionID: connection.id,
    //         authenticatedUser: connection.authenticatedUser
    //     });
    // }
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;