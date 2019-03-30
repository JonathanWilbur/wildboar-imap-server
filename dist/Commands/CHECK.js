"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Scanner_1 = require("../Scanner");
exports.CHECK_COMMAND = new CommandPlugin_1.CommandPlugin("CHECK", async (connection, tag, command) => {
    connection.scanner.readNewLine();
    const response = await connection.server.messageBroker.check(connection.authenticatedUser);
    if (response.checked)
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    connection.scanner.state = Scanner_1.ScanningState.LINE;
});
