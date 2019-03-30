"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.DELETE_COMMAND = new CommandPlugin_1.CommandPlugin("DELETE", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readNewLine();
    const response = await connection.server.messageBroker.delete(connection.authenticatedUser, mailboxName.toString());
    if (response.deleted)
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
});
