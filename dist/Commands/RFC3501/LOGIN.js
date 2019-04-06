"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const Lexeme_1 = require("../../Lexeme");
const Server_1 = require("../../Server");
exports.default = new CommandPlugin_1.CommandPlugin(function* (scanner, currentCommand) {
    switch (currentCommand.length) {
        case (2): {
            if (scanner.readSpace())
                yield new Lexeme_1.Lexeme(2, Buffer.from(" "));
        }
        case (3): {
            const userid = scanner.readAstring();
            if (!userid)
                return;
            yield userid;
        }
        case (4): {
            if (scanner.readSpace())
                yield new Lexeme_1.Lexeme(2, Buffer.from(" "));
        }
        case (5): {
            const password = scanner.readAstring();
            if (!password)
                return;
            yield password;
        }
        case (6): {
            if (scanner.readNewLine())
                yield new Lexeme_1.Lexeme(3, Buffer.from("\r\n"));
            break;
        }
        default: {
            yield new Lexeme_1.Lexeme(0, Buffer.from("Too many arguments."));
        }
    }
}, (connection, tag, command, args) => {
    const credentials = args.filter((lexeme) => {
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
                connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
                connection.authenticatedUser = username;
            }
            else
                connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
        });
    }
    else {
        connection.server.messageBroker.publishAuthentication("PLAIN", {
            messages: [
                (Buffer.from(`${username}\x00${username}\x00${password}`)).toString("base64")
            ]
        })
            .then((response) => {
            if (!("done" in response))
                throw Error(`Authentication driver response using mechanism 'PLAIN' did not include a "done" field.`);
            if (response["done"]) {
                if ("authenticatedUser" in response && typeof response["authenticatedUser"] === "string") {
                    connection.authenticatedUser = response["authenticatedUser"];
                    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
                }
                else {
                    connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
                }
            }
            else {
                connection.socket.write(`${tag} NO ${command} Unexpected error.\r\n`);
            }
        });
    }
});
//# sourceMappingURL=LOGIN.js.map