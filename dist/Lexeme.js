"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Lexeme {
    constructor(type, token) {
        this.type = type;
        this.token = token;
    }
    toString() {
        switch (this.type) {
            case (4):
            case (8):
            case (11):
                return this.token.toString();
            case (5): return this.token.toString().toUpperCase();
            case (6): return "(";
            case (7): return ")";
            case (9): {
                if (this.token.length <= 2)
                    return "";
                return this.token
                    .slice(1, (this.token.length - 1))
                    .toString()
                    .replace(/\\\\/g, '\\')
                    .replace(/\\"/g, '"');
            }
            default: return "";
        }
    }
    toLiteralLength() {
        if (this.type !== 10)
            throw new Error("Invalid Lexeme type: literal length cannot be parsed.");
        const match = /^\{(\d+)\}\r\n$/.exec(this.token.toString());
        if (!match)
            throw new Error("Invalid literal length lexeme. THIS ERROR SHOULD NEVER OCCUR.");
        return parseInt(match[1]);
    }
}
exports.Lexeme = Lexeme;
