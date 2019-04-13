"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const SimpleMailboxLexer_1 = require("../../ArgumentLexers/SimpleMailboxLexer");
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length !== 4) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName = lexemes[3].toString();
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailboxName: mailboxName
    });
    if ("ok" in response && response["ok"]) {
        connection.writeOk(tag, command);
    }
    else
        connection.writeStatus(tag, "NO", "", command, "Failed.");
};
const plugin = new CommandPlugin_1.CommandPlugin(SimpleMailboxLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=DELETE.js.map