"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const allLexer = function* (scanner, currentCommand) {
    return;
};
const uidLexer = function* (scanner, currentCommand) {
    const lastLexeme = currentCommand[currentCommand.length - 1];
    console.log(lastLexeme.type);
    switch (lastLexeme.type) {
        case (28): {
            const space = scanner.readSpace();
            if (!space)
                return;
            console.log("Found a space");
            yield space;
            break;
        }
        case (1): {
            const uid = scanner.readSequenceSet();
            if (!uid)
                return;
            yield uid;
            break;
        }
        default: return;
    }
};
const lexMap = new Map([
    ["ALL", allLexer],
    ["UID", uidLexer],
]);
const lexer = function* (scanner, currentCommand) {
    const lastLexeme = currentCommand[currentCommand.length - 1];
    do {
        switch (lastLexeme.type) {
            case (1): {
                let key = null;
                key = scanner.readSearchKey();
                if (!key)
                    return;
                yield key;
                break;
            }
            case (28): {
                const keyLexer = lexMap.get(lastLexeme.toString().toUpperCase());
                if (!keyLexer) {
                    throw new Error(`Cannot understand search key '${lastLexeme.toString()}'.`);
                }
                yield* keyLexer(scanner, currentCommand);
            }
            default: {
                let space = null;
                try {
                    space = scanner.readSpace();
                }
                catch (e) {
                    const newline = scanner.readCommandTerminatingNewLine();
                    if (!newline)
                        return;
                    yield newline;
                    return;
                }
                if (!space)
                    return;
                yield space;
            }
        }
    } while (true);
};
const handler = async (connection, tag, command, lexemes) => {
    lexemes.forEach((lex) => {
        connection.writeData(`SEARCH ${lex.toString()}`);
    });
    connection.writeOk(tag, command);
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=SEARCH.js.map