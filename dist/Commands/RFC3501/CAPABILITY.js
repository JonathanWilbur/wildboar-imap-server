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
const handler = (connection, tag, command, args) => {
    connection.socket.write(`* ${command} ${Array.from(connection.server.capabilities.values()).join(" ")}\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
exports.default = plugin;
//# sourceMappingURL=CAPABILITY.js.map