"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
exports.default = new CommandPlugin_1.CommandPlugin(function* (scanner, currentCommand) {
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
}, async (connection, tag, command, args) => {
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {});
    if ("created" in response && response["created"])
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
});
//# sourceMappingURL=CREATE.js.map