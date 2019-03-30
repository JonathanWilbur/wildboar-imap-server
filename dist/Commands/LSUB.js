"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.LSUB_COMMAND = new CommandPlugin_1.CommandPlugin("LSUB", async (connection, tag, command) => {
    connection.scanner.readSpace();
    const mailboxName = await connection.scanner.readAstring();
    connection.scanner.readSpace();
    const referenceName = await connection.scanner.readMailboxList();
    connection.scanner.readNewLine();
    connection.server.messageBroker.lsub(connection.authenticatedUser, referenceName.toString(), mailboxName.toString())
        .then((response) => {
        response.lsubItems.forEach((lsubItem) => {
            connection.socket.write(`* ${command} (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}\r\n`);
        });
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    });
});
