"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Scanner_1 = require("../Scanner");
exports.CAPABILITY_COMMAND = new CommandPlugin_1.CommandPlugin("CAPABILITY", (connection, tag) => {
    const command = "CAPABILITY";
    connection.scanner.readNewLine();
    connection.socket.write(`* ${command} ${connection.server.capabilities.join(" ")}\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    connection.scanner.state = Scanner_1.ScanningState.COMMAND_NAME;
});
