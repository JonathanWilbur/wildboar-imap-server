"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
class Scanner {
    constructor() {
        this.receivedData = Buffer.alloc(0);
        this.scanCursor = 0;
    }
    enqueueData(data) {
        this.receivedData = Buffer.concat([this.receivedData.slice(this.scanCursor), data]);
        this.scanCursor = 0;
    }
    scanLine() {
        const indexOfCRLF = this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1)
            return null;
        const lexeme = new Lexeme_1.default(0, this.receivedData.slice(this.scanCursor, indexOfCRLF));
        this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
        return lexeme;
    }
}
Scanner.LINE_TERMINATOR = "\r\n";
exports.default = Scanner;
