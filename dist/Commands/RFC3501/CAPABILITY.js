"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
exports.default = new CommandPlugin_1.CommandPlugin(function* (scanner, currentcommand) {
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
}, (connection, tag, command, args) => {
    connection.socket.write(`* ${command} ${Array.from(connection.server.capabilities.values()).join(" ")}\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
});
//# sourceMappingURL=CAPABILITY.js.map