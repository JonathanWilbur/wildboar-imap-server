"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const ReferenceAndMailboxLexer_1 = require("../../ArgumentLexers/ReferenceAndMailboxLexer");
const Ajv = require("ajv");
const LSUB_1 = require("../../ResponseSchema/LSUB");
const ajv = new Ajv();
const validate = ajv.compile(LSUB_1.schema);
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
        response["lsubItems"].forEach((lsubItem) => {
            connection.writeData(`LSUB (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}`);
        });
        connection.writeOk(tag, command);
    }
    catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: "LSUB",
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(ReferenceAndMailboxLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=LSUB.js.map