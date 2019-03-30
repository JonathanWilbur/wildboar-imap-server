"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.CAPABILITY_COMMAND = new CommandPlugin_1.CommandPlugin("CAPABILITY", (connection, tag, command) => {
    connection.scanner.readNewLine();
    connection.socket.write(`* ${command} ${connection.server.capabilities.join(" ")}\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
});
