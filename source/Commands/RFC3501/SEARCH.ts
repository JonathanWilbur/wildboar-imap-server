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
// TODO: Create readDate() and use it.
// TODO: Create type alias for search key lexers

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

type SearchKeyLexer = (scanner : Scanner, currentCommand : Lexeme[]) => IterableIterator<Lexeme>;

function currentSearchKey (currentCommand : Lexeme[]) : Lexeme[] {
    for (let i : number = currentCommand.length - 1; i > 0; i--) {
        if (currentCommand[i].type === LexemeType.SEARCH_KEY) {
            return currentCommand.slice(i);
        }
    }
    return currentCommand;
}

const nullLexer : SearchKeyLexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    return;
}

const uidLexer : SearchKeyLexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    scanner.readSpace();
    const uid : Lexeme | null = scanner.readSequenceSet();
    if (!uid) return;
    yield uid;
}

// TODO: template this (lengthOfCommand, readCommand)
// "HEADER" SP header-fld-name SP astring
const headerLexer : SearchKeyLexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
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

const lexMap: Map<string, SearchKeyLexer> = new Map([

    // One-word search keys.
    ["ALL", nullLexer],
    ["ANSWERED", nullLexer],
    ["DELETED", nullLexer],
    ["FLAGGED", nullLexer],
    ["NEW", nullLexer],
    ["OLD", nullLexer],
    ["RECENT", nullLexer],
    ["SEEN", nullLexer],
    ["UNANSWERED", nullLexer],
    ["UNDELETED", nullLexer],
    ["UNFLAGGED", nullLexer],
    ["UNSEEN", nullLexer],
    ["DRAFT", nullLexer],
    ["UNDRAFT", nullLexer],

    // Search keys that use arguments.
    ["UID", uidLexer],
    ["HEADER", headerLexer],
    // "BCC" SP astring
    // "BEFORE" SP date
    // "BODY" SP astring
    // "CC" SP astring
    // "FROM" SP astring
    // "KEYWORD" SP flag-keyword
    // "ON" SP date
    // "SINCE" SP date
    // "SUBJECT" SP astring
    // "TEXT" SP astring
    // "TO" SP astring
    // "UNKEYWORD" SP flag-keyword
    // "HEADER" SP header-fld-name SP astring
    // "LARGER" SP number
    // "NOT" SP search-key
    // "OR" SP search-key SP search-key
    // "SENTBEFORE" SP date
    // "SENTON" SP date
    // "SENTSINCE" SP date
    // "SMALLER" SP number
    // "UID" SP sequence-set
    // sequence-set
    // "(" search-key *(SP search-key) ")"
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
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;