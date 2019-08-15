import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";
import { storageDriverResponseSchema } from "../../ResponseSchema/StorageResponsesSchema";
import * as Ajv from "ajv";

const recognizedStatusItems : Set<string> = new Set<string>([
    "MESSAGES",
    "RECENT",
    "UIDNEXT",
    "UIDVALIDITY",
    "UNSEEN"
]);

const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    title: "STATUS response",
    type: "object",
    additionalProperties: true,
    properties: {
        messages: {
            type: "number",
            minimum: 0
        },
        recent: {
            type: "number",
            minimum: 0
        },
        uidNext: {
            type: "number",
            minimum: 0
        },
        uidValidity: {
            type: "number",
            minimum: 0
        },
        unseen: {
            type: "number",
            minimum: 0
        }
    }
};

const ajv : Ajv.Ajv = new Ajv();
const validate = ajv.addSchema(storageDriverResponseSchema).compile(schema);

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
    if (currentCommand.length <= 5) {
        const listStart : Lexeme | null = scanner.readSpecificToken(
            new Lexeme(LexemeType.LIST_START, Buffer.from("("))
        );
        if (!listStart) return;
        yield listStart;
    }

    // REVIEW: DoS?
    if (currentCommand[currentCommand.length - 1].type !== LexemeType.LIST_END) {
        let lex : Lexeme | null = null;
        do {
            try {
                lex =
                    scanner.readAny(
                        scanner.readSpace.bind(scanner),
                        scanner.readAtom.bind(scanner),
                        scanner.readListEnd.bind(scanner)
                    );
            } catch (e) {
                break;
            }
            if (!lex) return;
            yield lex;
        } while (true);
    }

    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
    if (!newline) return;
    yield newline;
    return;
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length <= 6) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName : string = lexemes[3].toString();
    const statusDataItemNames : Set<string> = new Set<string>(
        lexemes
            .slice(6, -1)
            .filter((lexeme : Lexeme) : boolean => { 
                return (lexeme.type === LexemeType.ATOM);
            })
            .map((lexeme : Lexeme) => lexeme.toString()) // #UTF_SAFE, because these are all atoms.
    );
    
    statusDataItemNames.forEach((item : string) : void => {
        if (!recognizedStatusItems.has(item))
            throw new Error(`Invalid STATUS data item, '${item}'.`);
    });
    
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailboxName: mailboxName,
            statusDataItemNames: statusDataItemNames
        });
    try {
        await validate(response);
        if ("errorsToShowToUser" in response) {
            (<any[]>(<any>response)["errorsToShowToUser"]).forEach((error : any) : void => {
                connection.writeData(`BAD ${error}`);
            });
        }

        if ((<any>response)["ok"]) {
            const responseItems : string[] = [];
            if ((<any>response)["messages"])
                responseItems.push(`MESSAGES ${(<any>response)["messages"]}`);
            if ((<any>response)["recent"])
                responseItems.push(`RECENT ${(<any>response)["recent"]}`);
            if ((<any>response)["uidNext"])
                responseItems.push(`UIDNEXT ${(<any>response)["uidNext"]}`);
            if ((<any>response)["uidValidity"])
                responseItems.push(`UIDVALIDITY ${(<any>response)["uidValidity"]}`);
            if ((<any>response)["unseen"])
                responseItems.push(`UNSEEN ${(<any>response)["unseen"]}`);
            connection.writeData(`STATUS ${mailboxName} (${responseItems.join(" ")})`);
            connection.writeOk(tag, command);
        } else connection.writeStatus(tag, "NO", "", command, "Failed.");
    } catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: "STATUS",
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;