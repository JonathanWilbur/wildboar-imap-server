"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const lexer = function* (scanner, currentcommand) {
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
const handler = async (connection, tag, command, lexemes) => {
    connection.writeData("CAPABILITY " + Array.from(connection.server.capabilities.values()).join(" "));
    connection.writeOk(tag, command);
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
exports.default = plugin;
//# sourceMappingURL=CAPABILITY.js.map