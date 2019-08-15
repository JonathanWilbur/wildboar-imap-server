import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";
import { storageDriverResponseSchema } from "../../ResponseSchema/StorageResponsesSchema";
import { imapPrint } from "../../imapPrint";
import * as Ajv from "ajv";

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

    if (currentCommand.length >= 6) {
        if (currentCommand[5].type === LexemeType.LIST_START) {
            while (true) {
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
                        }
                        const lex : Lexeme | null = scanner.readAny(
                            scanner.readListEnd.bind(scanner),
                            // scanner.readFetchSection.bind(scanner),
                            scanner.readSpace.bind(scanner),
                        );
                        if (!lex) return;
                        yield lex;
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

    let fetchAtts: string[] = [];
    if (lexemes[5].type === LexemeType.LIST_START) {
        const fetchAttLexemes: Lexeme[] = lexemes
            .slice(6, -1)
            .filter((l: Lexeme): boolean => l.type !== LexemeType.WHITESPACE);
        for (let i : number = 0; i < fetchAttLexemes.length; i++) {
            if (
                fetchAttLexemes[i].type === LexemeType.SECTION
                || fetchAttLexemes[i].type === LexemeType.PARTIAL
            ) {
                fetchAtts[fetchAtts.length - 1] += fetchAttLexemes[i].toString();
            } else {
                fetchAtts.push(fetchAttLexemes[i].toString());
            }
        }
    } else {
        fetchAtts = [
            lexemes
                .slice(5)
                .map((l: Lexeme): string => l.toString())
                .join("")
        ];
    }

    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            useUID: connection.useUID,
            sequenceSet: lexemes[3].toString(),
            fetchAttributes: fetchAtts,
        });
    try {
        // TODO: await validate(response);
        if ("errorsToShowToUser" in response) {
            (<any[]>(<any>response)["errorsToShowToUser"]).forEach((error : any) : void => {
                connection.writeData(`BAD ${error}`);
            });
        }

        if ((response as any)["ok"] && (response as any)["results"]) {
            (response as any)["results"].forEach((result: any) => {
                connection.writeData(`${result["id"]} FETCH (${result["attributes"].map((attr: any) => attr.attribute + " " + imapPrint(attr.value)).join(" ")})`);
            });
            connection.writeOk(tag, command);
        } else connection.writeStatus(tag, "NO", "", `${connection.useUID ? "UID " : ""}${command}`, "Failed.");
    } catch (e) {
        connection.writeStatus(tag, "NO", "", `${connection.useUID ? "UID " : ""}${command}`, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: command,
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }

};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;