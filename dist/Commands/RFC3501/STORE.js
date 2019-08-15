"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
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
            const seqset = scanner.readSequenceSet();
            if (!seqset)
                return;
            yield seqset;
        }
        case (4): {
            const space = scanner.readSpace();
            if (!space)
                return;
            yield space;
        }
        case (5): {
            const atom = scanner.readAtom();
            if (!atom)
                return;
            yield atom;
        }
        case (6): {
            const space = scanner.readSpace();
            if (!space)
                return;
            yield space;
        }
        case (7): {
            const space = scanner.readListStart();
            if (!space)
                return;
            yield space;
        }
        default: {
            let lex = null;
            while (!lex || (lex && lex.type !== 7)) {
                try {
                    lex = scanner.readAny(scanner.readFlag.bind(scanner), scanner.readSpace.bind(scanner), scanner.readListEnd.bind(scanner));
                }
                catch (e) {
                    break;
                }
                if (!lex)
                    return;
                yield lex;
            }
            ;
            const newline = scanner.readCommandTerminatingNewLine();
            if (!newline)
                return;
            yield newline;
            break;
        }
    }
};
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length < 7) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const sequenceSet = lexemes[3].toString();
    const messageDataItemName = lexemes[5].toString();
    const flags = lexemes.slice(8, -1).map(l => l.toString());
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        sequenceSet,
        messageDataItemName,
        flags,
    });
    try {
        connection.writeOk(tag, command);
    }
    catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: "STORE",
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.SELECTED;
exports.default = plugin;
//# sourceMappingURL=STORE.js.map