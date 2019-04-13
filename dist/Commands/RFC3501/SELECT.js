"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const lexer = function* (scanner, currentCommand) {
    if (currentCommand.length <= 2) {
        const space = scanner.readSpace();
        if (!space)
            return;
        yield space;
    }
    if (currentCommand.length <= 3) {
        const mailboxName = scanner.readAstring();
        if (!mailboxName)
            return;
        yield mailboxName;
    }
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
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
        connection.hasWritePermissionOnCurrentlySelectedMailbox = true;
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=SELECT.js.map