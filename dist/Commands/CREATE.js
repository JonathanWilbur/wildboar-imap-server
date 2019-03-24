"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Scanner_1 = require("../Scanner");
exports.CREATE_COMMAND = new CommandPlugin_1.CommandPlugin("CREATE", async (connection, tag) => {
    const command = "CREATE";
    console.log(connection.scanner.readSpace());
    const mailboxName = await connection.scanner.readAstring();
    console.log(mailboxName);
    connection.scanner.readNewLine();
    connection.server.messageBroker.create(connection.authenticatedUser, mailboxName)
        .then((response) => {
        if (response.created)
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else
            connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        connection.scanner.state = Scanner_1.ScanningState.COMMAND_NAME;
    });
});
