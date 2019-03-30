"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.UNSUBSCRIBE_COMMAND = new CommandPlugin_1.CommandPlugin("UNSUBSCRIBE", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readNewLine();
    connection.server.messageBroker.unsubscribe(connection.authenticatedUser, mailboxName.toString())
        .then((response) => {
        if (response.unsubscribed)
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else
            connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    });
});
