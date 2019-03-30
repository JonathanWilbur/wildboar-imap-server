"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.EXAMINE_COMMAND = new CommandPlugin_1.CommandPlugin("EXAMINE", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readNewLine();
    const response = await connection.server.messageBroker.examine(connection.authenticatedUser, mailboxName.toString());
    connection.socket.write(`* ${response.exists} EXISTS\r\n` +
        `* ${response.recent} RECENT\r\n` +
        `* FLAGS (${response.flags.map((flag) => ("\\" + flag)).join(" ")})\r\n` +
        `${tag} OK [READ-ONLY] ${command} Completed.\r\n`);
});
