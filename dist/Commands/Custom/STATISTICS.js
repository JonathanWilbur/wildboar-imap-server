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
    connection.writeData(`Connection Socket String: ${connection.socketString}`);
    connection.writeData(`Connection Commands Executed: ${connection.commandsExecuted}`);
    connection.writeData(`Connection Authentication Attempts: ${connection.authenticationAttempts}`);
    connection.writeData(`Connection Authorization Failures: ${connection.authorizationFailures}`);
    connection.writeData(`Connection Invalid State Errors: ${connection.invalidStateErrors}`);
    connection.writeData(`Connection Tag Read Failures: ${connection.tagReadFailures}`);
    connection.writeData(`Connection Unknown Command Errors: ${connection.unknownCommandsAttempted}`);
    connection.writeData(`Connection Command Execution Errors: ${connection.commandExecutionErrors}`);
    connection.writeData(`Connection Bad Argument Errors: ${connection.badArgumentFailures}`);
    connection.writeData(`Server ID: ${connection.server.id}`);
    connection.writeData(`Server Creation Time: ${connection.server.creationTime.toISOString()}`);
    connection.writeOk(tag, command);
};
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=STATISTICS.js.map