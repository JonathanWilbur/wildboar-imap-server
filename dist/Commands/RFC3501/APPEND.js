"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const StorageResponsesSchema_1 = require("../../ResponseSchema/StorageResponsesSchema");
const Ajv = require("ajv");
const ajv = new Ajv();
const validate = ajv.compile(StorageResponsesSchema_1.storageDriverResponseSchema);
const lexer = function* (scanner, currentCommand) {
    if (currentCommand.length <= 2) {
        const space = scanner.readSpace();
        if (!space)
            return;
        yield space;
    }
    if (currentCommand.length <= 3) {
        const mailboxName = scanner.readAstring();
        if (!mailboxName)
            return;
        yield mailboxName;
    }
    if (currentCommand.length <= 4) {
        const space = scanner.readSpace();
        if (!space)
            return;
        yield space;
    }
    let lex = null;
    do {
        try {
            lex =
                scanner.readAny(scanner.readSpace.bind(scanner), scanner.readAstring.bind(scanner), scanner.readFlag.bind(scanner), scanner.readListStart.bind(scanner), scanner.readListEnd.bind(scanner));
        }
        catch (e) {
            break;
        }
        if (!lex)
            return;
        yield lex;
    } while (true);
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length <= 5) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName = lexemes[3].toString();
    const nonSpaceLexemes = lexemes.filter((lexeme) => {
        return (lexeme.type !== 1);
    });
    const flags = new Set([]);
    let date = "";
    let message = Buffer.alloc(0);
    let parseCursor = 3;
    if (nonSpaceLexemes[parseCursor].type === 6) {
        parseCursor++;
        while (parseCursor < nonSpaceLexemes.length) {
            if (nonSpaceLexemes[parseCursor].type === 7) {
                parseCursor++;
                break;
            }
            if (!(nonSpaceLexemes[parseCursor].type === 13))
                throw new Error(`Non-flag encountered in list. Flag character codes: ${nonSpaceLexemes[parseCursor].token.join(" ")}.`);
            flags.add(nonSpaceLexemes[parseCursor].toString());
            parseCursor++;
        }
    }
    if (nonSpaceLexemes[parseCursor].type === 9) {
        date = nonSpaceLexemes[parseCursor].token.toString();
        parseCursor++;
    }
    if (nonSpaceLexemes[parseCursor].type === 11) {
        message = nonSpaceLexemes[parseCursor].token;
    }
    console.log(date);
    console.log(date);
    console.log(message);
    console.log(Array.from(flags));
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailboxName: mailboxName,
        date: date,
        message: message.toString(),
        flags: Array.from(flags)
    });
    try {
        await validate(response);
        if ("errorsToShowToUser" in response) {
            response["errorsToShowToUser"].forEach((error) => {
                connection.writeData(`BAD ${error}`);
            });
        }
        if (response["ok"]) {
            connection.writeOk(tag, command);
        }
        else
            connection.writeStatus(tag, "NO", "", command, "Failed.");
    }
    catch (e) {
        connection.writeStatus(tag, "NO", "", command, "Failed.");
        connection.server.logger.error({
            topic: "imap.json",
            message: e.message,
            error: e,
            command: command,
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=APPEND.js.map