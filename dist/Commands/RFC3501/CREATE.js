"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
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
const handler = async (connection, tag, command, args) => {
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {});
    if ("created" in response && response["created"])
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
exports.default = plugin;
//# sourceMappingURL=CREATE.js.map