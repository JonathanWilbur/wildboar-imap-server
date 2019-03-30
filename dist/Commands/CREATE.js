"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.CREATE_COMMAND = new CommandPlugin_1.CommandPlugin("CREATE", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    if (mailboxName.type === 10) {
        const literalLength = mailboxName.toLiteralLength();
        if (literalLength > 10) {
            connection.socket.write(`${tag} BAD ${command} Failed. Your mailbox name is too long.\r\n`);
            return;
        }
    }
    connection.scanner.readNewLine();
    const response = await connection.server.messageBroker.create(connection.authenticatedUser, mailboxName.toString());
    if (response.created)
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
});
