"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Lexeme {
    constructor(type, token) {
        this.type = type;
        this.token = token;
    }
    toString() {
        switch (this.type) {
            case (5): return this.token.toString();
            case (6): return "(";
            case (7): return ")";
            case (8): return this.token.toString();
            case (9): return this.token.toString().replace("\\", "");
            default: return "";
        }
    }
}
exports.default = Lexeme;
