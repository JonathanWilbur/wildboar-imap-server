"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../CommandPlugin");
const Lexeme_1 = require("../Lexeme");
exports.LOGIN_COMMAND = new CommandPlugin_1.CommandPlugin(function* (scanner, currentCommand) {
    console.log(currentCommand);
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
    console.log(`Authenticating with username '${credentials[0].toString()}' and password '${credentials[1].toString()}'.`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
});
