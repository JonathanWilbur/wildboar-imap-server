"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const lexer = function* (scanner, currentCommand) {
    while (true) {
        const lastLexeme = currentCommand[currentCommand.length - 1];
        switch (lastLexeme.type) {
            case (5): {
                const space = scanner.readSpace();
                if (!space)
                    return;
                yield space;
                break;
            }
            case (1): {
                let lex = scanner.readAny(scanner.readSequenceSet.bind(scanner), scanner.readFlag.bind(scanner), scanner.readListStart.bind(scanner), scanner.readAstring.bind(scanner));
                if (!lex)
                    return;
                yield lex;
                break;
            }
            case (6): {
                let lex = scanner.readAny(scanner.readAstring.bind(scanner), scanner.readListStart.bind(scanner));
                if (!lex)
                    return;
                yield lex;
                break;
            }
            case (7): {
                let lex = scanner.readAny(scanner.readSpace.bind(scanner), scanner.readListEnd.bind(scanner), scanner.readCommandTerminatingNewLine.bind(scanner));
                if (!lex)
                    return;
                yield lex;
                break;
            }
            default: {
                let lex = scanner.readAny(scanner.readSpace.bind(scanner), scanner.readListEnd.bind(scanner), scanner.readCommandTerminatingNewLine.bind(scanner));
                if (!lex)
                    return;
                yield lex;
            }
        }
    }
};
const handler = async (connection, tag, command, lexemes) => {
    const query = {
        characterSet: 'utf8',
        query: undefined,
    };
    let indexOfStartOfSearchKey = 3;
    if (lexemes[3].toString().toUpperCase() === "CHARSET") {
        query.characterSet = lexemes[5].toString();
        indexOfStartOfSearchKey += 4;
    }
    query.query = lexemes.slice(indexOfStartOfSearchKey);
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, query);
    if ("ok" in response && response["ok"]) {
        if ("sequenceNumbers" in response
            && Array.isArray(response["sequenceNumbers"])
            && response["sequenceNumbers"].every(n => Number.isInteger(n))) {
            connection.writeData(response["sequenceNumbers"].join(" "));
        }
        connection.writeOk(tag, command);
    }
    else {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.SELECTED;
exports.default = plugin;
//# sourceMappingURL=SEARCH.js.map