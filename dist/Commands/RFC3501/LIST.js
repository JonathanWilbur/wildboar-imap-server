"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const ReferenceAndMailboxLexer_1 = require("../../ArgumentLexers/ReferenceAndMailboxLexer");
const Ajv = require("ajv");
const LIST_1 = require("../../ResponseSchema/LIST");
const ajv = new Ajv();
const validate = ajv.compile(LIST_1.schema);
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length !== 6) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName = lexemes[3].toString();
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailboxName: mailboxName
    });
    try {
        await validate(response);
        response["listItems"].forEach((listItem) => {
            connection.writeData(`LIST (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}`);
        });
        connection.writeOk(tag, command);
    }
    catch (e) {
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
const plugin = new CommandPlugin_1.CommandPlugin(ReferenceAndMailboxLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=LIST.js.map