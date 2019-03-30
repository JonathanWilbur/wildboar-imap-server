"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.CLOSE_COMMAND = new CommandPlugin_1.CommandPlugin("CLOSE", async (connection, tag, command) => {
    connection.scanner.readNewLine();
    const response = await connection.server.messageBroker.close(connection.authenticatedUser);
    if (response.closed)
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
});
