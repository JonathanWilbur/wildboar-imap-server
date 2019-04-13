"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const handler = async (connection, tag, command, lexemes) => {
    connection.writeOk(tag, command);
};
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
exports.default = plugin;
//# sourceMappingURL=NOOP.js.map