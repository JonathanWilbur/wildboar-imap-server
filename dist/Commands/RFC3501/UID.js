"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const Lexeme_1 = require("../../Lexeme");
const lexer = function* (scanner, currentCommand) {
    const space = scanner.readSpace();
    if (!space)
        return;
    yield new Lexeme_1.Lexeme(4, currentCommand[0].token);
};
const handler = async (connection, tag, command, lexemes) => {
    connection.useUID = true;
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.SELECTED;
exports.default = plugin;
//# sourceMappingURL=UID.js.map