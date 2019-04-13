"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = function* (scanner, currentCommand) {
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
        const mailboxName = scanner.readMailboxList();
        if (!mailboxName)
            return;
        yield mailboxName;
    }
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
//# sourceMappingURL=ReferenceAndMailboxLexer.js.map