import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
import { Scanner } from "../../Scanner";
// import * as Ajv from "ajv";
import { LexemeType } from "../../LexemeType";
// import { schema } from "../../ResponseSchema/LSUB";

// const ajv : Ajv.Ajv = new Ajv();
// const validate = ajv.compile(schema);

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    while (true) {
        const lastLexeme: Lexeme = currentCommand[currentCommand.length - 1];
        switch (lastLexeme.type) {
            case (LexemeType.COMMAND_NAME): {
                const space : Lexeme | null = scanner.readSpace();
                if (!space) return;
                yield space;
                break;
            }
            case (LexemeType.WHITESPACE): {
                let lex : Lexeme | null = scanner.readAny(
                    scanner.readSequenceSet.bind(scanner),
                    // TODO: readDate
                    scanner.readFlag.bind(scanner),
                    scanner.readListStart.bind(scanner),
                    scanner.readAstring.bind(scanner),
                );
                if (!lex) return;
                yield lex;
                break;
            }
            case (LexemeType.LIST_START): {
                let lex : Lexeme | null = scanner.readAny(
                    scanner.readAstring.bind(scanner),
                    scanner.readListStart.bind(scanner),
                );
                if (!lex) return;
                yield lex;
                break;
            }
            case (LexemeType.LIST_END): {
                let lex : Lexeme | null = scanner.readAny(
                    scanner.readSpace.bind(scanner),
                    scanner.readListEnd.bind(scanner),
                    scanner.readCommandTerminatingNewLine.bind(scanner),
                );
                if (!lex) return;
                yield lex;
                break;
            }
            default: {
                let lex : Lexeme | null = scanner.readAny(
                    scanner.readSpace.bind(scanner),
                    scanner.readListEnd.bind(scanner),
                    scanner.readCommandTerminatingNewLine.bind(scanner),
                );
                if (!lex) return;
                yield lex;
            }
        }
    }
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    const query = {
        characterSet: 'utf8',
        query: undefined as any,
    };
    let indexOfStartOfSearchKey : number = 3;
    if (lexemes[3].toString().toUpperCase() === "CHARSET") {
        // TODO: Validate the characterSet.
        query.characterSet = lexemes[5].toString();
        indexOfStartOfSearchKey += 4;
    }
    query.query = lexemes.slice(indexOfStartOfSearchKey);
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, query);
    if ("ok" in response && (<any>response)["ok"]) {
        if (
            "sequenceNumbers" in response
            && Array.isArray((response as any)["sequenceNumbers"])
            && ((response as any)["sequenceNumbers"] as number[]).every(n => Number.isInteger(n))
        ) {
            connection.writeData(((response as any)["sequenceNumbers"] as number[]).join(" "));
        }
        connection.writeOk(tag, command);
    } else connection.writeStatus(tag, "NO", "", command, "Failed.");
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;