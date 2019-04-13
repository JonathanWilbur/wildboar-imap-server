"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const SimpleMailboxLexer_1 = require("../../ArgumentLexers/SimpleMailboxLexer");
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length !== 4) {
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        return;
    }
    const mailboxName = lexemes[3].toString();
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailboxName: lexemes[3].toString()
    });
    if ("ok" in response && response["ok"]) {
        connection.currentlySelectedMailbox = mailboxName;
        connection.hasWritePermissionOnCurrentlySelectedMailbox = false;
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
};
const plugin = new CommandPlugin_1.CommandPlugin(SimpleMailboxLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=EXAMINE.js.map