"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const handler = async (connection, tag, command, lexemes) => {
    connection.writeStatus(tag, "BAD", "", command, "STARTTLS is not supported by this server.");
};
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=STARTTLS.js.map