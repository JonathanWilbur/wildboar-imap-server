import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
import { lexer } from "../../ArgumentLexers/ReferenceAndMailboxLexer";
import * as Ajv from "ajv";
import { schema } from "../../ResponseSchema/LIST";

const ajv : Ajv.Ajv = new Ajv();
const validate = ajv.compile(schema);

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length !== 6) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName : string = lexemes[3].toString();
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailboxName: mailboxName
        });
    try {
        await validate(response);
        (<any[]>(<any>response)["listItems"]).forEach((listItem : any) : void => {
            connection.writeData(`LIST (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}`);
        });
        connection.writeOk(tag, command);
    } catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: "LIST",
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;