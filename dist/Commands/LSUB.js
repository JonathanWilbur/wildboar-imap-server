"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Scanner_1 = require("../Scanner");
exports.LSUB_COMMAND = new CommandPlugin_1.CommandPlugin("LSUB", async (connection, tag) => {
    const command = "LSUB";
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    console.log(mailboxName);
    connection.scanner.readSpace();
    const referenceName = await connection.scanner.readMailboxList();
    console.log(`Reference name: ${referenceName}`);
    connection.scanner.readNewLine();
    connection.server.messageBroker.lsub(connection.authenticatedUser, referenceName, mailboxName)
        .then((response) => {
        response.lsubItems.forEach((lsubItem) => {
            connection.socket.write(`* ${command} (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}\r\n`);
        });
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        connection.scanner.state = Scanner_1.ScanningState.COMMAND_NAME;
    });
});
