import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import * as Ajv from "ajv";
import { storageDriverResponseSchema } from "../../ResponseSchema/StorageResponsesSchema";

const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    title: "EXPUNGE response",
    type: "object",
    additionalProperties: true,
    properties: {
        expungements: {
            type: "array",
            items: {
                type: "number"
            }
        }
    },
    required: [
        "expungements"
    ]
};

const ajv : Ajv.Ajv = new Ajv();
const validate = ajv.addSchema(storageDriverResponseSchema).compile(schema);

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailbox: connection.currentlySelectedMailbox
        });
    try {
        await validate(response);
        if ("errorsToShowToUser" in response) {
            (<any[]>(<any>response)["errorsToShowToUser"]).forEach((error : any) : void => {
                connection.writeData(`BAD ${error}`);
            });
        }

        (<number[]>(<any>response)["expungements"])
            .forEach((expungement : number) : void => {
                connection.writeData(`${expungement} EXPUNGE`);
            });

        if ((<any>response)["ok"]) connection.writeOk(tag, command);
        else connection.writeStatus(tag, "NO", "", command, "Failed.");
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
plugin.acceptableConnectionState = ConnectionState.SELECTED;
export default plugin;