"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const lexer = function* (scanner, currentcommand) {
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
const handler = async (connection, tag, command, lexemes) => {
    connection.state = ConnectionState_1.ConnectionState.LOGOUT;
    connection.authenticatedUser = "";
    connection.writeData(`BYE ${connection.server.configuration.imap_server_valediction}`);
    connection.writeOk(tag, command);
    connection.close();
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
exports.default = plugin;
//# sourceMappingURL=LOGOUT.js.map