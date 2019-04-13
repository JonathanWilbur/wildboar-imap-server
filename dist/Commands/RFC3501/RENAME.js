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
    if (currentCommand.length <= 4) {
        const space = scanner.readSpace();
        if (!space)
            return;
        yield space;
    }
    if (currentCommand.length <= 5) {
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
    if (lexemes.length !== 6) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const existingMailboxName = lexemes[3].toString();
    const newMailboxName = lexemes[5].toString();
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        existingMailboxName: existingMailboxName,
        newMailboxName: newMailboxName
    });
    if ("ok" in response && response["ok"])
        connection.writeOk(tag, command);
    else
        connection.writeStatus(tag, "NO", "", command, "Failed.");
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=RENAME.js.map