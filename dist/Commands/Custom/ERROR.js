"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const ConnectionState_1 = require("../../ConnectionState");
const handler = async (connection, tag, command) => {
    throw new Error(`Command '${command}' executed by user '${connection.authenticatedUser}'.`);
};
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=ERROR.js.map