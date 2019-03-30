"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.SUBSCRIBE_COMMAND = new CommandPlugin_1.CommandPlugin("SUBSCRIBE", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readNewLine();
    connection.server.messageBroker.subscribe(connection.authenticatedUser, mailboxName.toString())
        .then((response) => {
        if (response.subscribed)
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else
            connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    });
});
