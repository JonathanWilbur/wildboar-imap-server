"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Scanner_1 = require("../Scanner");
exports.LOGIN_COMMAND = new CommandPlugin_1.CommandPlugin("LOGIN", (connection, tag) => {
    const command = "LOGIN";
    connection.scanner.readLine();
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    connection.scanner.state = Scanner_1.ScanningState.COMMAND_NAME;
});
