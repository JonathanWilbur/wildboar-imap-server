"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const Lexeme_1 = require("../../Lexeme");
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
const handler = async (connection, tag, command, lexemes) => {
    const saslMechanism = lexemes[3].toString();
    const saslResponses = lexemes.filter((lexeme) => {
        return (lexeme.type === 13);
    });
    const response = await connection.server.messageBroker.publishAuthentication(saslMechanism, {
        messages: saslResponses.map((saslResponse) => saslResponse.toString())
    });
    if (!("done" in response))
        throw new Error(`Authentication driver response using mechanism '${saslMechanism}' did not include a "done" field.`);
    if (response["done"]) {
        if ("authenticatedUser" in response && typeof response["authenticatedUser"] === "string") {
            connection.authenticatedUser = response["authenticatedUser"];
            connection.state = ConnectionState_1.ConnectionState.AUTHENTICATED;
            connection.writeOk(tag, command);
        }
        else {
            connection.writeStatus(tag, "NO", "", command, "Authentication failed.");
        }
        connection.currentCommand = [];
    }
    else {
        if ("nextChallenge" in response && typeof response["nextChallenge"] === "string")
            connection.writeContinuationRequest(response["nextChallenge"]);
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=AUTHENTICATE.js.map