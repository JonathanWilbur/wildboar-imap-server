"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.SELECT_COMMAND = new CommandPlugin_1.CommandPlugin("SELECT", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readNewLine();
    connection.server.messageBroker.select(connection.authenticatedUser, mailboxName.toString())
        .then((response) => {
        connection.socket.write(`* ${response.exists} EXISTS\r\n` +
            `* ${response.recent} RECENT\r\n` +
            `* FLAGS (${response.flags.map((flag) => ("\\" + flag)).join(" ")})\r\n` +
            `${tag} OK ${response.readOnly ? "[READ-ONLY]" : "[READ-WRITE]"} ${command} Completed.\r\n`);
    });
});
