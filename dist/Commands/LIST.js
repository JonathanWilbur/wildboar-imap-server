"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Scanner_1 = require("../Scanner");
exports.LIST_COMMAND = new CommandPlugin_1.CommandPlugin("LIST", async (connection, tag) => {
    const command = "LIST";
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    console.log(mailboxName);
    connection.scanner.readSpace();
    const referenceName = await connection.scanner.readMailboxList();
    console.log(`Reference name: ${referenceName}`);
    connection.scanner.readNewLine();
    connection.server.messageBroker.list(connection.authenticatedUser, referenceName, mailboxName)
        .then((response) => {
        response.listItems.forEach((listItem) => {
            connection.socket.write(`* ${command} (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}\r\n`);
        });
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        connection.scanner.state = Scanner_1.ScanningState.COMMAND_NAME;
    });
});
