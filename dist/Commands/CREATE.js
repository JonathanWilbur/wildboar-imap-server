"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Lexeme_1 = require("../Lexeme");
exports.CREATE_COMMAND = new CommandPlugin_1.CommandPlugin(function* (scanner, currentCommand) {
    if (currentCommand.length <= 2) {
        if (scanner.readSpace())
            yield new Lexeme_1.Lexeme(2, Buffer.from(" "));
    }
    if (currentCommand.length <= 3) {
        const mailboxName = scanner.readAstring();
        if (!mailboxName)
            return;
        yield mailboxName;
    }
    if (scanner.readNewLine())
        yield new Lexeme_1.Lexeme(3, Buffer.from("\r\n"));
    return;
}, async (connection, tag, command, args) => {
    const response = await connection.server.messageBroker.publishCommand("", command, {});
    if ("created" in response && response["created"])
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
});
//# sourceMappingURL=CREATE.js.map