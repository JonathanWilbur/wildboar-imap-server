import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";
import { storageDriverResponseSchema } from "../../ResponseSchema/StorageResponsesSchema";
import * as Ajv from "ajv";

const ajv : Ajv.Ajv = new Ajv();
const validate = ajv.compile(storageDriverResponseSchema);

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    if (currentCommand.length <= 2) {
        const space : Lexeme | null = scanner.readSpace();
        if (!space) return;
        yield space;
    }
    if (currentCommand.length <= 3) {
        const mailboxName : Lexeme | null = scanner.readAstring();
        if (!mailboxName) return;
        yield mailboxName;
    }
    if (currentCommand.length <= 4) {
        const space : Lexeme | null = scanner.readSpace();
        if (!space) return;
        yield space;
    }
    let lex : Lexeme | null = null;
    do {
        try {
            lex =
                scanner.readAny(
                    scanner.readSpace.bind(scanner),
                    scanner.readAstring.bind(scanner),
                    scanner.readFlag.bind(scanner),
                    scanner.readListStart.bind(scanner),
                    scanner.readListEnd.bind(scanner)
                );
        } catch (e) {
            break;
        }
        if (!lex) return;
        yield lex;
    } while (true);

    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
    if (!newline) return;
    yield newline;
    return;
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length <= 5) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName : string = lexemes[3].toString();

    const nonSpaceLexemes : Lexeme[] = lexemes.filter((lexeme : Lexeme) : boolean => {
        return (lexeme.type !== LexemeType.WHITESPACE);
    });
    const flags : Set<string> = new Set<string>([]);
    let date : string = ""; // TODO: Make this an actual date.
    let message : Buffer = Buffer.alloc(0);
    let parseCursor : number = 3; // We already read tag, command, mailbox.

    // Then it is the flags list
    if (nonSpaceLexemes[parseCursor].type === LexemeType.LIST_START) {
        parseCursor++;
        while (parseCursor < nonSpaceLexemes.length) {
            if (nonSpaceLexemes[parseCursor].type === LexemeType.LIST_END) {
                parseCursor++;
                break;
            }
            if (!(nonSpaceLexemes[parseCursor].type === LexemeType.FLAG))
                throw new Error(`Non-flag encountered in list. Flag character codes: ${nonSpaceLexemes[parseCursor].token.join(" ")}.`);
            flags.add(nonSpaceLexemes[parseCursor].toString());
            parseCursor++;
        }
    }

    // Then it is a date
    if (nonSpaceLexemes[parseCursor].type === LexemeType.QUOTED_STRING) {
        date = nonSpaceLexemes[parseCursor].token.toString();
        parseCursor++;
    }

    if (nonSpaceLexemes[parseCursor].type === LexemeType.STRING_LITERAL) {
        message = nonSpaceLexemes[parseCursor].token; // WARNING: Copied by reference. Not cloned.
    }
    
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailboxName: mailboxName,
            date: date,
            message: message.toString(),
            flags: Array.from(flags)
        });
    try {
        await validate(response);
        if ("errorsToShowToUser" in response) {
            (<any[]>(<any>response)["errorsToShowToUser"]).forEach((error : any) : void => {
                connection.writeData(`BAD ${error}`);
            });
        }

        if ((<any>response)["ok"]) {
            connection.writeOk(tag, command);
        } else connection.writeStatus(tag, "NO", "", command, "Failed.");
    } catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
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