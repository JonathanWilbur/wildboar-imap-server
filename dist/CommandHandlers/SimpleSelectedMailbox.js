"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = async (connection, tag, command, lexemes) => {
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailbox: connection.currentlySelectedMailbox
    });
    if ("ok" in response && response["ok"])
        connection.writeOk(tag, command);
    else
        connection.writeStatus(tag, "NO", "", command, "Failed.");
};
//# sourceMappingURL=SimpleSelectedMailbox.js.map