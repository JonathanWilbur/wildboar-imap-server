"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const ConnectionState_1 = require("../../ConnectionState");
const StorageResponsesSchema_1 = require("../../ResponseSchema/StorageResponsesSchema");
const imapPrint_1 = require("../../imapPrint");
const Ajv = require("ajv");
const ajv = new Ajv();
const validate = ajv.addSchema(StorageResponsesSchema_1.storageDriverResponseSchema);
const lexer = function* (scanner, currentCommand) {
    if (currentCommand.length <= 2) {
        const space = scanner.readSpace();
        if (!space)
            return;
        yield space;
    }
    if (currentCommand.length <= 3) {
        const sequenceSet = scanner.readSequenceSet();
        if (!sequenceSet)
            return;
        yield sequenceSet;
    }
    if (currentCommand.length <= 4) {
        const space = scanner.readSpace();
        if (!space)
            return;
        yield space;
    }
    if (currentCommand.length <= 5) {
        const fetch = scanner.readAny(scanner.readListStart.bind(scanner), scanner.readFetchAtt.bind(scanner));
        if (!fetch)
            return;
        yield fetch;
    }
    if (currentCommand.length >= 6) {
        if (currentCommand[5].type === 6) {
            switch (currentCommand[currentCommand.length - 1].type) {
                case (6): {
                    const lex = scanner.readAny(scanner.readListEnd.bind(scanner), scanner.readFetchAtt.bind(scanner));
                    if (!lex)
                        return;
                    yield lex;
                    break;
                }
                case (8): {
                    const lastSection = currentCommand[currentCommand.length - 1].toString();
                    if (lastSection === "BODY" || lastSection === "BODY.PEEK") {
                        let section = null;
                        try {
                            section = scanner.readFetchSection();
                            if (section) {
                                yield section;
                            }
                        }
                        catch (e) { }
                    }
                    const lex = scanner.readAny(scanner.readListEnd.bind(scanner), scanner.readFetchSection.bind(scanner), scanner.readSpace.bind(scanner));
                    if (!lex)
                        return;
                    yield lex;
                    break;
                }
                case (22): {
                    let partial = null;
                    try {
                        partial = scanner.readFetchPartial();
                    }
                    catch (e) { }
                    if (partial) {
                        yield partial;
                    }
                    else {
                        const lex = scanner.readAny(scanner.readListEnd.bind(scanner), scanner.readFetchPartial.bind(scanner), scanner.readSpace.bind(scanner));
                        if (!lex)
                            return;
                        yield lex;
                    }
                    break;
                }
                case (25): {
                    const lex = scanner.readAny(scanner.readListEnd.bind(scanner), scanner.readSpace.bind(scanner));
                    if (!lex)
                        return;
                    yield lex;
                    break;
                }
                case (1): {
                    const lex = scanner.readFetchAtt();
                    if (!lex)
                        return;
                    yield lex;
                    break;
                }
                case (7): {
                    const lex = scanner.readCommandTerminatingNewLine();
                    if (!lex)
                        return;
                    yield lex;
                    return;
                }
            }
        }
        else {
            if (currentCommand[currentCommand.length - 1].type === 8) {
                const lastSection = currentCommand[currentCommand.length - 1].toString();
                if (lastSection === "BODY" || lastSection === "BODY.PEEK") {
                    let section = null;
                    try {
                        section = scanner.readFetchSection();
                        if (section) {
                            yield section;
                        }
                    }
                    catch (e) { }
                }
            }
            if (currentCommand[currentCommand.length - 1].type === 22) {
                let partial = null;
                try {
                    partial = scanner.readFetchPartial();
                    if (partial) {
                        yield partial;
                    }
                }
                catch (e) { }
            }
            const newline = scanner.readCommandTerminatingNewLine();
            if (!newline)
                return;
            yield newline;
            return;
        }
    }
};
const handler = async (connection, tag, command, lexemes) => {
    if (lexemes.length < 6) {
        connection.writeStatus(tag, "BAD", "", command, "Too few arguments.");
        return;
    }
    let fetchAtts = [];
    if (lexemes[5].type === 6) {
        const fetchAttLexemes = lexemes
            .slice(6, -1)
            .filter((l) => l.type !== 1);
        for (let i = 0; i < fetchAttLexemes.length; i++) {
            if (fetchAttLexemes[i].type === 22
                || fetchAttLexemes[i].type === 25) {
                fetchAtts[fetchAtts.length - 1] += fetchAttLexemes[i].toString();
            }
            else {
                fetchAtts.push(fetchAttLexemes[i].toString());
            }
        }
        fetchAtts.forEach((fa) => connection.writeData(`FETCH ${fa}`));
    }
    else {
        fetchAtts = [
            lexemes
                .slice(5)
                .map((l) => l.toString())
                .join("")
        ];
        connection.writeData(`FETCH ${fetchAtts[0]}`);
    }
    const response = await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
        sequenceSet: lexemes[3].toString(),
        fetchAttributes: fetchAtts,
    });
    try {
        if ("errorsToShowToUser" in response) {
            response["errorsToShowToUser"].forEach((error) => {
                connection.writeData(`BAD ${error}`);
            });
        }
        if (response["ok"]) {
            response["results"].forEach((result) => {
                connection.writeData(`${result["id"]} FETCH ${result["attributes"].map((attr) => attr.attribute + ' ' + imapPrint_1.imapPrint(attr.value))}`);
            });
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
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=FETCH.js.map