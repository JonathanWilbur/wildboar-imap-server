"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Lexeme_1 = require("../Lexeme");
exports.CAPABILITY_COMMAND = new CommandPlugin_1.CommandPlugin(function* (scanner, currentcommand) {
    if (scanner.readNewLine())
        yield new Lexeme_1.Lexeme(3, Buffer.from("\r\n"));
    return;
}, (connection, tag, command, args) => {
    connection.socket.write(`* ${command} ${connection.server.capabilities.join(" ")}\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
});
//# sourceMappingURL=CAPABILITY.js.map