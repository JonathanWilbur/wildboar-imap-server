"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Lexeme {
    constructor(type, token) {
        this.type = type;
        this.token = token;
    }
    getTag() {
        if (this.type !== 0)
            return "";
        if (this.token.length === 0)
            return "";
        const indexOfFirstSpace = this.token.indexOf(" ");
        const command = ((indexOfFirstSpace === -1) ?
            this.token : this.token.slice(0, indexOfFirstSpace));
        return command.toString();
    }
    getCommand() {
        if (this.type !== 0)
            return "";
        if (this.token.length === 0)
            return "";
        const subtokens = this.token.toString().split(/\s+/);
        if (subtokens.length < 2)
            return "";
        return subtokens[1];
    }
    getArguments() {
        if (this.type !== 0)
            return "";
        if (this.token.length === 0)
            return "";
        const indexOfFirstSpace = this.token.indexOf(" ");
        if (indexOfFirstSpace === -1)
            return "";
        const indexOfSecondSpace = this.token.indexOf(" ", indexOfFirstSpace + 1);
        if (indexOfSecondSpace === -1)
            return "";
        return this.token.toString().slice(indexOfSecondSpace);
    }
}
exports.default = Lexeme;
