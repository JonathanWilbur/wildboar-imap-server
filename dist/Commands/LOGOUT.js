"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const ConnectionState_1 = require("../ConnectionState");
exports.LOGOUT_COMMAND = new CommandPlugin_1.CommandPlugin("LOGOUT", async (connection, tag, command) => {
    connection.scanner.readNewLine();
    connection.socket.write(`* BYE (Bye message goes here.)\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    connection.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
    connection.authenticatedUser = "";
    connection.close();
});
