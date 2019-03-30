"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.LIST_COMMAND = new CommandPlugin_1.CommandPlugin("LIST", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readSpace();
    const referenceName = await connection.scanner.readMailboxList();
    connection.scanner.readNewLine();
    connection.server.messageBroker.list(connection.authenticatedUser, referenceName.toString(), mailboxName.toString())
        .then((response) => {
        response.listItems.forEach((listItem) => {
            connection.socket.write(`* ${command} (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}\r\n`);
        });
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    });
});
