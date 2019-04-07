"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const Lexeme_1 = require("../../Lexeme");
const lexer = function* (scanner, currentCommand) {
    switch (currentCommand.length) {
        case (2): {
            const space = scanner.readSpace();
            if (!space)
                return;
            yield space;
        }
        case (3): {
            const saslMechanism = scanner.readSASLMechanism();
            if (!saslMechanism)
                return;
            yield saslMechanism;
        }
        case (4): {
            const newline = scanner.readNewLine();
            if (!newline)
                return;
            yield newline;
        }
        default: {
            if (currentCommand[currentCommand.length - 1].type === 4) {
                const saslMessage = scanner.readAbortableBase64();
                if (!saslMessage)
                    return;
                yield saslMessage;
            }
            else {
                if (scanner.readNewLine())
                    yield new Lexeme_1.Lexeme(4, Buffer.from("\r\n"));
                else
                    return;
            }
        }
    }
};
const handler = (connection, tag, command, args) => {
    const saslMechanism = args[3].toString();
    const saslResponses = args.filter((lexeme) => {
        return (lexeme.type === 13);
    });
    connection.server.messageBroker.publishAuthentication(saslMechanism, {
        messages: saslResponses.map((saslResponse) => saslResponse.toString())
    })
        .then((response) => {
        if (!("done" in response))
            throw Error(`Authentication driver response using mechanism '${saslMechanism}' did not include a "done" field.`);
        if (response["done"]) {
            if ("authenticatedUser" in response && typeof response["authenticatedUser"] === "string") {
                connection.authenticatedUser = response["authenticatedUser"];
                connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            }
            else {
                connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
            }
            connection.currentCommand = [];
        }
        else {
            if ("nextChallenge" in response && typeof response["nextChallenge"] === "string")
                connection.socket.write(`+ ${response["nextChallenge"]}\r\n`);
        }
    });
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
exports.default = plugin;
//# sourceMappingURL=AUTHENTICATE.js.map