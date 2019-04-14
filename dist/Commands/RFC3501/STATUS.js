"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const Lexeme_1 = require("../../Lexeme");
const ConnectionState_1 = require("../../ConnectionState");
const StorageResponsesSchema_1 = require("../../ResponseSchema/StorageResponsesSchema");
const Ajv = require("ajv");
const recognizedStatusItems = new Set([
    "MESSAGES",
    "RECENT",
    "UIDNEXT",
    "UIDVALIDITY",
    "UNSEEN"
]);
const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    title: "STATUS response",
    type: "object",
    additionalProperties: true,
    properties: {
        messages: {
            type: "number",
            minimum: 0
        },
        recent: {
            type: "number",
            minimum: 0
        },
        uidNext: {
            type: "number",
            minimum: 0
        },
        uidValidity: {
            type: "number",
            minimum: 0
        },
        unseen: {
            type: "number",
            minimum: 0
        }
    }
};
const ajv = new Ajv();
const validate = ajv.addSchema(StorageResponsesSchema_1.storageDriverResponseSchema).compile(schema);
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
    if (currentCommand.length <= 5) {
        const listStart = scanner.readSpecificToken(new Lexeme_1.Lexeme(6, Buffer.from("(")));
        if (!listStart)
            return;
        yield listStart;
    }
    if (currentCommand[currentCommand.length - 1].type !== 7) {
        let lex = null;
        do {
            try {
                lex =
                    scanner.readAny(scanner.readSpace.bind(scanner), scanner.readAtom.bind(scanner), scanner.readListEnd.bind(scanner));
            }
            catch (e) {
                break;
            }
            if (!lex)
                return;
            yield lex;
        } while (true);
    }
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length <= 6) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const mailboxName = lexemes[3].toString();
    const statusDataItemNames = new Set(lexemes
        .slice(6, -1)
        .filter((lexeme) => {
        return (lexeme.type === 8);
    })
        .map((lexeme) => lexeme.toString()));
    statusDataItemNames.forEach((item) => {
        if (!recognizedStatusItems.has(item))
            throw new Error(`Invalid STATUS data item, '${item}'.`);
    });
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        mailboxName: mailboxName,
        statusDataItemNames: statusDataItemNames
    });
    try {
        await validate(response);
        if ("errorsToShowToUser" in response) {
            response["errorsToShowToUser"].forEach((error) => {
                connection.writeData(`BAD ${error}`);
            });
        }
        if (response["ok"]) {
            const responseItems = [];
            if (response["messages"])
                responseItems.push(`MESSAGES ${response["messages"]}`);
            if (response["recent"])
                responseItems.push(`RECENT ${response["recent"]}`);
            if (response["uidNext"])
                responseItems.push(`UIDNEXT ${response["uidNext"]}`);
            if (response["uidValidity"])
                responseItems.push(`UIDVALIDITY ${response["uidValidity"]}`);
            if (response["unseen"])
                responseItems.push(`UNSEEN ${response["unseen"]}`);
            connection.writeData(`STATUS ${mailboxName} (${responseItems.join(" ")})`);
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
            command: "STATUS",
            socket: connection.socketReport,
            connectionID: connection.id,
            authenticatedUser: connection.authenticatedUser
        });
    }
};
const plugin = new CommandPlugin_1.CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=STATUS.js.map