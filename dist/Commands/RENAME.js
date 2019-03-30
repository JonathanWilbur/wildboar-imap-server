"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.RENAME_COMMAND = new CommandPlugin_1.CommandPlugin("RENAME", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const existingMailboxName = await connection.scanner.readAstring();
    connection.scanner.readSpace();
    const newMailboxName = await connection.scanner.readAstring();
    connection.scanner.readNewLine();
    connection.server.messageBroker.rename(connection.authenticatedUser, existingMailboxName.toString(), newMailboxName.toString())
        .then((response) => {
        if (response.renamed)
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else
            connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    });
});
