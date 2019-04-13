"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexer = function* (scanner, currentcommand) {
    const newline = scanner.readCommandTerminatingNewLine();
    if (!newline)
        return;
    yield newline;
    return;
};
//# sourceMappingURL=NewLineLexer.js.map