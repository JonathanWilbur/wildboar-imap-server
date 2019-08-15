"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const Server_1 = require("../../Server");
const ConnectionState_1 = require("../../ConnectionState");
const lexer = function* (scanner, currentCommand) {
    switch (currentCommand.length) {
        case (2): {
            const space = scanner.readSpace();
            if (!space)
                return;
            yield space;
        }
        case (3): {
            const userid = scanner.readAstring();
            if (!userid)
                return;
            yield userid;
        }
        case (4): {
            const space = scanner.readSpace();
            if (!space)
                return;
            yield space;
        }
        case (5): {
            const password = scanner.readAstring();
            if (!password)
                return;
            yield password;
        }
        case (6): {
            const newline = scanner.readCommandTerminatingNewLine();
            if (!newline)
                return;
            yield newline;
            break;
        }
        default:
            throw new Error("Too many arguments supplied to the LOGIN command.");
    }
};
const handler = async (connection, tag, command, lexemes) => {
    connection.authenticationAttempts++;
    if (connection.authenticationAttempts > 3) {
        connection.server.logger.warn({
            topic: `command.${command}`,
            message: `Connection ${connection.id} closed because of excessive failed authentication failures.`,
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser,
            applicationLayerProtocol: "IMAP"
        });
        connection.close();
        return;
    }
    const credentials = lexemes.filter((lexeme) => {
        return (lexeme.type === 8 ||
            lexeme.type === 9 ||
            lexeme.type === 11);
    });
    const username = credentials[0].toString().toLowerCase();
    const password = credentials[1].toString();
    connection.server.logger.info({
        message: `Authenticating with username '${credentials[0].toString()}' and password '${credentials[1].toString()}'.`
    });
    if (username in connection.server.driverlessAuthenticationDatabase) {
        Server_1.Server.passwordHash(password).then((passhash) => {
            if (connection.server.driverlessAuthenticationDatabase[username] === passhash) {
                connection.authenticatedUser = username;
                connection.state = ConnectionState_1.ConnectionState.AUTHENTICATED;
                connection.writeOk(tag, command);
            }
            else
                connection.writeStatus(tag, "NO", "", command, "Incorrect username or password.");
        });
    }
    else {
        const response = await connection.server.messageBroker.publishAuthentication("PLAIN", {
            messages: [
                (Buffer.from(`${username}\x00${username}\x00${password}`)).toString("base64")
            ]
        });
        if (!("done" in response))
            throw Error(`Authentication driver response using mechanism 'PLAIN' did not include a "done" field.`);
        if (response["done"]) {
            if ("authenticatedUser" in response && typeof response["authenticatedUser"] === "string") {
                connection.authenticatedUser = response["authenticatedUser"];
                connection.state = ConnectionState_1.ConnectionState.AUTHENTICATED;
                connection.writeOk(tag, command);
            }
            else {
                connection.writeStatus(tag, "NO", "", command, "Incorrect username or password.");
            }
        }
        else {
            connection.writeStatus(tag, "NO", "", command, "Failed.");
        }
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=LOGIN.js.map