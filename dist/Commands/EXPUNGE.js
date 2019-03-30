"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.EXPUNGE_COMMAND = new CommandPlugin_1.CommandPlugin("EXPUNGE", async (connection, tag, command) => {
    connection.scanner.readNewLine();
    const response = await connection.server.messageBroker.expunge(connection.authenticatedUser);
    if (response.expunged)
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
});
