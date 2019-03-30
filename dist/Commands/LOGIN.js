"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
exports.LOGIN_COMMAND = new CommandPlugin_1.CommandPlugin("LOGIN", (connection, tag, command) => {
    connection.scanner.skipLine();
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
});
