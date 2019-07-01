import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";
import { storageDriverResponseSchema } from "../../ResponseSchema/StorageResponsesSchema";
import * as Ajv from "ajv";

// fetch           = "FETCH" SP sequence-set SP ("ALL" / "FULL" / "FAST" /
//                   fetch-att / "(" fetch-att *(SP fetch-att) ")")
// fetch-att       = "ENVELOPE" / "FLAGS" / "INTERNALDATE" /
//                   "RFC822" [".HEADER" / ".SIZE" / ".TEXT"] /
//                   "BODY" ["STRUCTURE"] / "UID" /
//                   "BODY" section ["<" number "." nz-number ">"] /
//                   "BODY.PEEK" section ["<" number "." nz-number ">"]
// section         = "[" [section-spec] "]"
// section-msgtext = "HEADER" / "HEADER.FIELDS" [".NOT"] SP header-list / "TEXT"
// section-part    = nz-number *("." nz-number)
// section-spec    = section-msgtext / (section-part ["." section-text])
// section-text    = section-msgtext / "MIME"
// header-list     = "(" header-fld-name *(SP header-fld-name) ")"
// header-fld-name = astring
// atom            = 1*ATOM-CHAR
// ATOM-CHAR       = <any CHAR except atom-specials>
// atom-specials   = "(" / ")" / "{" / SP / CTL / list-wildcards /
//                   quoted-specials / resp-specials

/*
    readAtom until "BODY" or "BODY.PEEK"
    If "BODY" or "BODY.PEEK":
        readSectionStart
        while Lexeme !== SectionEnd:
            readAstring | readSpace | readListStart | readListEnd | readSectionEnd
        readPartial
    continue readAtom
    readListEnd
    For each one found, append it to a list of fetch-attributes.
    The specification does not say that the server has to return them in order,
    and the returned items are labeled, but it would be a good idea to return
    them all in order, just in case.
    Check that the requested number of items matches received.
*/

const ajv : Ajv.Ajv = new Ajv();
const validate = ajv.addSchema(storageDriverResponseSchema);

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    if (currentCommand.length <= 2) {
        const space : Lexeme | null = scanner.readSpace();
        if (!space) return;
        yield space;
    }
    if (currentCommand.length <= 3) {
        const sequenceSet : Lexeme | null = scanner.readSequenceSet();
        if (!sequenceSet) return;
        yield sequenceSet;
    }
    if (currentCommand.length <= 4) {
        const space : Lexeme | null = scanner.readSpace();
        if (!space) return;
        yield space;
    }
    if (currentCommand.length <= 5) {
        const fetch: Lexeme | null = scanner.readAny(
            scanner.readListStart.bind(scanner),
            scanner.readFetchAtt.bind(scanner),
        );
        if (!fetch) return;
        yield fetch;
    }
    
    // if (currentCommand.length <= 6) {
    //     if (currentCommand[currentCommand.length - 1].type === LexemeType.ATOM) {
    //         const lastSection : string = currentCommand[currentCommand.length - 1].toString();
    //         if (lastSection === "BODY" || lastSection === "BODY.PEEK") {
    //             let section : Lexeme | null = null;
    //             try {
    //                 section = scanner.readFetchSection();
    //                 if (section) {
    //                     yield section;
    //                 }
    //             } catch (e) {
    //                 console.log(e);
    //             }
    //         }
    //     }
    //     else {
    //         let lex : Lexeme | null = null;
    //         do {
        
    //             if (currentCommand[currentCommand.length - 1].type === LexemeType.ATOM) {
    //                 const lastSection : string = currentCommand[currentCommand.length - 1].toString();
    //                 if (lastSection === "BODY" || lastSection === "BODY.PEEK") {
    //                     let section : Lexeme | null = null;
    //                     try {
    //                         section = scanner.readFetchSection();
    //                     } catch (e) {}
    //                     if (section) {
    //                         yield section;
    //                         let partial : Lexeme | null = null;
    //                         try {
    //                             partial = scanner.readFetchPartial();
    //                         } catch (e) {}
    //                         if (partial) {
    //                             yield partial;
    //                         }
    //                     }
    //                 }
    //             }
        
    //             try {
    //                 lex = scanner.readAny(
    //                     scanner.readAtom.bind(scanner),
    //                     scanner.readSpace.bind(scanner),
    //                 );
    //             } catch (e) {
    //                 break;
    //             }
    //             if (!lex) return;
    //             yield lex;
    //         } while (true);

    //         const listEnd : Lexeme | null = scanner.readListEnd();
    //         if (!listEnd) return;
    //         yield listEnd;
    //     }
    // }

    if (currentCommand.length >= 6) {
        if (currentCommand[5].type === LexemeType.LIST_START) {
            switch (currentCommand[currentCommand.length - 1].type) {
                case (LexemeType.LIST_START): {
                    const lex : Lexeme | null = scanner.readAny(
                        scanner.readListEnd.bind(scanner),
                        scanner.readFetchAtt.bind(scanner),
                    );
                    if (!lex) return;
                    yield lex;
                    break;
                }
                case (LexemeType.ATOM): {
                    const lastSection : string = currentCommand[currentCommand.length - 1].toString();
                    if (lastSection === "BODY" || lastSection === "BODY.PEEK") {
                        let section : Lexeme | null = null;
                        try {
                            section = scanner.readFetchSection();
                            if (section) {
                                yield section;
                            }
                        } catch (e) {}
                    } else {
                        const lex : Lexeme | null = scanner.readAny(
                            scanner.readListEnd.bind(scanner),
                            scanner.readFetchSection.bind(scanner),
                            scanner.readSpace.bind(scanner),
                        );
                        if (!lex) return;
                        yield lex;
                    }
                    break;
                }
                case (LexemeType.SECTION): {
                    let partial : Lexeme | null = null;
                    try {
                        partial = scanner.readFetchPartial();
                    } catch (e) {}
                    if (partial) {
                        yield partial;
                    } else {
                        const lex : Lexeme | null = scanner.readAny(
                            scanner.readListEnd.bind(scanner),
                            scanner.readFetchPartial.bind(scanner),
                            scanner.readSpace.bind(scanner),
                        );
                        if (!lex) return;
                        yield lex;
                    }
                    break;
                }
                case (LexemeType.PARTIAL): {
                    const lex : Lexeme | null = scanner.readAny(
                        scanner.readListEnd.bind(scanner),
                        scanner.readSpace.bind(scanner),
                    );
                    if (!lex) return;
                    yield lex;
                    break;
                }
                case (LexemeType.WHITESPACE): {
                    const lex : Lexeme | null = scanner.readFetchAtt();
                    if (!lex) return;
                    yield lex;
                    break;
                }
                case (LexemeType.LIST_END): {
                    const lex : Lexeme | null = scanner.readCommandTerminatingNewLine();
                    if (!lex) return;
                    yield lex;
                    return;
                }
            }
        } else { // It is a single fetch-att
            if (currentCommand[currentCommand.length - 1].type === LexemeType.ATOM) {
                const lastSection : string = currentCommand[currentCommand.length - 1].toString();
                if (lastSection === "BODY" || lastSection === "BODY.PEEK") {
                    let section : Lexeme | null = null;
                    try {
                        section = scanner.readFetchSection();
                        if (section) {
                            yield section;
                        }
                    } catch (e) {}
                }
            }
            if (currentCommand[currentCommand.length - 1].type === LexemeType.SECTION) {
                let partial : Lexeme | null = null;
                try {
                    partial = scanner.readFetchPartial();
                    if (partial) {
                        yield partial;
                    }
                } catch (e) {}
            }

            const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
            if (!newline) return;
            yield newline;
            return;
        }
    }
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length < 6) {
        connection.writeStatus(tag, "BAD", "", command, "Too few arguments.");
        return;
    }

    if (lexemes[5].type === LexemeType.LIST_START) {
        const fetchAtts: string[] = lexemes
            .slice(6, -1)
            .filter((l: Lexeme): boolean => l.type !== LexemeType.WHITESPACE)
            .map((l: Lexeme): string => l.toString());
        fetchAtts.forEach((fa) => connection.writeData(`FETCH ${fa}`));
    } else {
        const fetchAtt: string = lexemes
            .slice(5)
            .map((l: Lexeme): string => l.toString())
            .join("");
        connection.writeData(`FETCH ${fetchAtt}`);
    }
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
// plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;