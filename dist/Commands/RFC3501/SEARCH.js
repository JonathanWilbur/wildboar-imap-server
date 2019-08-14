"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
function currentSearchKey(currentCommand) {
    for (let i = currentCommand.length - 1; i > 0; i--) {
        if (currentCommand[i].type === 28) {
            return currentCommand.slice(i);
        }
    }
    return currentCommand;
}
const nullLexer = function* (scanner, currentCommand) {
    return;
};
const uidLexer = function* (scanner, currentCommand) {
    scanner.readSpace();
    const uid = scanner.readSequenceSet();
    if (!uid)
        return;
    yield uid;
};
const headerLexer = function* (scanner, currentCommand) {
    while (currentSearchKey(currentCommand).length < 5) {
        switch (currentCommand[currentCommand.length - 1].type) {
            case (1): {
                const astr = scanner.readAstring();
                if (!astr)
                    return;
                yield astr;
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
    }
};
const lexMap = new Map([
    ["ALL", nullLexer],
    ["UID", uidLexer],
    ["HEADER", headerLexer],
]);
const lexer = function* (scanner, currentCommand) {
    const lastLexeme = currentCommand[currentCommand.length - 1];
    do {
        switch (lastLexeme.type) {
            case (5): {
                const space = scanner.readSpace();
                if (!space)
                    return;
                yield space;
            }
            case (1): {
                let key = null;
                key = scanner.readSearchKey();
                if (!key)
                    return;
                yield key;
            }
            case (28): {
                const searchKey = currentCommand[currentCommand.length - 1].toString().toUpperCase();
                const keyLexer = lexMap.get(searchKey);
                if (!keyLexer) {
                    throw new Error(`Cannot understand search key '${searchKey}'.`);
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