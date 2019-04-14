"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const ConnectionState_1 = require("../../ConnectionState");
const Ajv = require("ajv");
const StorageResponsesSchema_1 = require("../../ResponseSchema/StorageResponsesSchema");
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
const ajv = new Ajv();
const validate = ajv.addSchema(StorageResponsesSchema_1.storageDriverResponseSchema).compile(schema);
const handler = async (connection, tag, command, lexemes) => {
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailbox: connection.currentlySelectedMailbox
    });
    try {
        await validate(response);
        if ("errorsToShowToUser" in response) {
            response["errorsToShowToUser"].forEach((error) => {
                connection.writeData(`BAD ${error}`);
            });
        }
        response["expungements"]
            .forEach((expungement) => {
            connection.writeData(`${expungement} EXPUNGE`);
        });
        if (response["ok"])
            connection.writeOk(tag, command);
        else
            connection.writeStatus(tag, "NO", "", command, "Failed.");
    }
    catch (e) {
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
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.SELECTED;
exports.default = plugin;
//# sourceMappingURL=EXPUNGE.js.map