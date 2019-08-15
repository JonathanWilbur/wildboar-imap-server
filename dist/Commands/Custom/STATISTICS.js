"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const ConnectionState_1 = require("../../ConnectionState");
const handler = async (connection, tag, command) => {
    connection.writeData(`Connection ID: ${connection.id}`);
    connection.writeData(`Connection Creation Time: ${connection.creationTime.toISOString()}`);
    connection.writeData(`Connection Authenticated User: ${connection.authenticatedUser}`);
    connection.writeData(`Connection Selected Mailbox: ${connection.currentlySelectedMailbox}`);
    connection.writeData(`Connection State: ${connection.state}`);
    connection.writeData(`Server ID: ${connection.server.id}`);
    connection.writeData(`Server Creation Time: ${connection.server.creationTime.toISOString()}`);
    connection.writeOk(tag, command);
};
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=STATISTICS.js.map