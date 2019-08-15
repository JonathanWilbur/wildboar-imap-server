// import * as Ajv from "ajv";
import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { ConnectionState } from "../../ConnectionState";
import { Lexeme } from "../../Lexeme";
// import { schema } from "../../ResponseSchema/LIST";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";

// const ajv : Ajv.Ajv = new Ajv();
// const validate = ajv.compile(schema);

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    switch (currentCommand.length) {
        case (2): {
            const space : Lexeme | null = scanner.readSpace();
            if (!space) return;
            yield space;
        }
        case (3): {
            const seqset : Lexeme | null = scanner.readSequenceSet();
            if (!seqset) return;
            yield seqset;
        }
        case (4): {
            const space : Lexeme | null = scanner.readSpace();
            if (!space) return;
            yield space;
        }
        case (5): {
            const atom : Lexeme | null = scanner.readAtom();
            if (!atom) return;
            yield atom;
        }
        case (6): {
            const space : Lexeme | null = scanner.readSpace();
            if (!space) return;
            yield space;
        }
        case (7): {
            const space : Lexeme | null = scanner.readListStart();
            if (!space) return;
            yield space;
        }
        default: {
            let lex : Lexeme | null = null;
            while (!lex || (lex && lex.type !== LexemeType.LIST_END)) {
                try {
                    lex = scanner.readAny(
                        scanner.readFlag.bind(scanner),
                        scanner.readSpace.bind(scanner),
                        scanner.readListEnd.bind(scanner),
                    );
                } catch (e) {
                    break;
                }
                if (!lex) return;
                yield lex;
            };
            const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
            if (!newline) return;
            yield newline;
            break;
        }
    }
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length < 7) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const sequenceSet : string = lexemes[3].toString();
    const messageDataItemName : string = lexemes[5].toString();
    const flags : string[] = lexemes.slice(8, -1).map(l => l.toString());
    
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            sequenceSet,
            messageDataItemName,
            flags,
        });
    try {
        // await validate(response);
        // (<any[]>(<any>response)["listItems"]).forEach((listItem : any) : void => {
        //     connection.writeData(`LIST (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}`);
        // });
        connection.writeOk(tag, command);
    } catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: "STORE",
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.SELECTED;
export default plugin;