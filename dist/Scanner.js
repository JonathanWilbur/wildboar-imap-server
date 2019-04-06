"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
class Scanner {
    constructor() {
        this.receivedData = Buffer.alloc(0);
        this.scanCursor = 0;
        this.ignoreEverythingUntilNewline = false;
    }
    lineReady() {
        return (this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor) !== -1);
    }
    enqueueData(data) {
        if (data.length === 0)
            return;
        if (this.ignoreEverythingUntilNewline) {
            const indexOfCRLF = data.indexOf(Scanner.LINE_TERMINATOR);
            if (indexOfCRLF === -1)
                return;
            this.receivedData = data.slice(indexOfCRLF + Scanner.LINE_TERMINATOR.length);
            this.scanCursor = 0;
            this.ignoreEverythingUntilNewline = false;
            return;
        }
        if (this.scanCursor === 0)
            this.receivedData = Buffer.concat([this.receivedData, data]);
        else
            this.receivedData = Buffer.concat([this.receivedData.slice(this.scanCursor), data]);
        this.scanCursor = 0;
    }
    skipLine() {
        const indexOfCRLF = this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1) {
            this.ignoreEverythingUntilNewline = true;
            return false;
        }
        else {
            this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
            return true;
        }
    }
    readTag() {
        const indexOfFirstSpace = this.receivedData.indexOf(" ".charCodeAt(0), this.scanCursor);
        if (indexOfFirstSpace === -1)
            throw new Error("No first space.");
        const tag = this.receivedData.slice(this.scanCursor, indexOfFirstSpace);
        if (!(tag.every(Scanner.isTagChar)))
            throw new Error("Invalid characters in tag.");
        this.scanCursor = (indexOfFirstSpace + ' '.length);
        return new Lexeme_1.Lexeme(5, tag);
    }
    readCommand() {
        let indexOfEndOfCommand = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfCommand = i;
                break;
            }
        }
        if (indexOfEndOfCommand === -1)
            throw new Error("No end of command.");
        const commandName = this.receivedData.slice(this.scanCursor, indexOfEndOfCommand);
        if (!(commandName.every(Scanner.isAtomChar)))
            throw new Error("Invalid characters in command name.");
        this.scanCursor = indexOfEndOfCommand;
        return new Lexeme_1.Lexeme(6, commandName);
    }
    readAstring() {
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readAtom();
    }
    readSpace() {
        if (this.receivedData[this.scanCursor] === ' '.charCodeAt(0)) {
            this.scanCursor++;
            return true;
        }
        else
            return false;
    }
    readNewLine() {
        if (this.scanCursor >= this.receivedData.length - 1)
            return false;
        if (this.receivedData[this.scanCursor] === '\r'.charCodeAt(0) &&
            this.receivedData[this.scanCursor + 1] === '\n'.charCodeAt(0)) {
            this.scanCursor += 2;
            return true;
        }
        else
            return false;
    }
    readDoubleQuotedString() {
        let i = (this.scanCursor + 1);
        let closingQuoteEncountered = false;
        while (i < this.receivedData.length) {
            if ((this.receivedData[i] === '\r'.charCodeAt(0)) ||
                (this.receivedData[i] === '\n'.charCodeAt(0)))
                throw new Error("CR or LF not permitted in a double-quoted string.");
            if ((this.receivedData[i] === '"'.charCodeAt(0)) &&
                (this.receivedData[(i - 1)] !== '\\'.charCodeAt(0))) {
                closingQuoteEncountered = true;
                break;
            }
            i++;
        }
        if (!closingQuoteEncountered)
            return null;
        const oldScanCursor = this.scanCursor;
        this.scanCursor = (i + 1);
        return new Lexeme_1.Lexeme(10, this.receivedData.slice(oldScanCursor, this.scanCursor));
    }
    readAtom() {
        let indexOfEndOfToken = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1)
            return null;
        const oldScanCursor = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme_1.Lexeme(9, this.receivedData.slice(oldScanCursor, indexOfEndOfToken));
    }
    readLiteralLength() {
        if (this.receivedData[this.scanCursor] !== '{'.charCodeAt(0))
            return null;
        const indexOfEndOfLiteralLength = this.receivedData.indexOf("}\r\n", this.scanCursor);
        if (indexOfEndOfLiteralLength === -1)
            return null;
        let i = (this.scanCursor + 1);
        while (i < indexOfEndOfLiteralLength) {
            if (!Scanner.isDigit(this.receivedData[i]))
                throw new Error("Non-digit detected in literal length.");
            i++;
        }
        const oldScanCursor = this.scanCursor;
        this.scanCursor = (indexOfEndOfLiteralLength + '}\r\n'.length);
        return new Lexeme_1.Lexeme(11, this.receivedData.slice(oldScanCursor, (indexOfEndOfLiteralLength + '}\r\n'.length)));
    }
    readList() {
        let indexOfEndOfToken = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isListChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1)
            throw new Error("No end of list encountered.");
        const oldScanCursor = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme_1.Lexeme(9, this.receivedData.slice(oldScanCursor, indexOfEndOfToken));
    }
    readString() {
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        throw new Error("The string you attempted to read was neither quoted string, nor a literal.");
    }
    readMailboxList() {
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readList();
    }
    readLiteral(length) {
        if (this.scanCursor + length > this.receivedData.length)
            return null;
        const oldScanCursor = this.scanCursor;
        this.scanCursor = (this.scanCursor + length);
        return new Lexeme_1.Lexeme(12, this.receivedData.slice(oldScanCursor, this.scanCursor));
    }
    readAbortableBase64() {
        if (this.receivedData[this.scanCursor] === '*'.charCodeAt(0)) {
            this.scanCursor++;
            return new Lexeme_1.Lexeme(21, Buffer.from("*"));
        }
        let indexOfEndOfToken = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isBase64Char(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1)
            return null;
        const oldScanCursor = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme_1.Lexeme(13, this.receivedData.slice(oldScanCursor, indexOfEndOfToken));
    }
    readSASLMechanism() {
        let indexOfEndOfToken = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isSASLMechanismNameChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1)
            return null;
        const oldScanCursor = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme_1.Lexeme(22, this.receivedData.slice(oldScanCursor, indexOfEndOfToken));
    }
    static isChar(char) {
        return (char >= 0x01 && char <= 0x7F);
    }
    static isAtomChar(char) {
        return ((Scanner.isChar(char)) &&
            (!(Scanner.isAtomSpecialChar(char))));
    }
    static isAtomSpecialChar(char) {
        return ((char === '('.charCodeAt(0)) ||
            (char === ')'.charCodeAt(0)) ||
            (char === '{'.charCodeAt(0)) ||
            (char === ' '.charCodeAt(0)) ||
            (Scanner.isControlCharacter(char)) ||
            (Scanner.isListWildcardChar(char)) ||
            (Scanner.isQuotedSpecialChar(char)) ||
            (Scanner.isResponseSpecialChar(char)));
    }
    static isControlCharacter(char) {
        return ((char >= 0x00 && char <= 0x1F) || (char === 0x7F));
    }
    static isTagChar(char) {
        return (Scanner.isAtomChar(char) && char !== '+'.charCodeAt(0));
    }
    static isDigit(char) {
        return (char >= 0x30 && char <= 0x39);
    }
    static isNonZeroDigit(char) {
        return (Scanner.isDigit(char) && char !== 0x30);
    }
    static isAstringChar(char) {
        return (Scanner.isAtomChar(char) || char === "]".charCodeAt(0));
    }
    static isBase64Char(char) {
        return ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(String.fromCharCode(char)) !== -1);
    }
    static isWhitespace(char) {
        return (char === 0x20 || char === '\t'.charCodeAt(0));
    }
    static isListWildcardChar(char) {
        return (char === '%'.charCodeAt(0) || char === '*'.charCodeAt(0));
    }
    static isQuotedSpecialChar(char) {
        return (char === '"'.charCodeAt(0) || char === '\\'.charCodeAt(0));
    }
    static isResponseSpecialChar(char) {
        return (char === ']'.charCodeAt(0));
    }
    static isSASLMechanismNameChar(char) {
        return ((char >= 0x41 && char <= 0x5A) ||
            (char >= 0x30 && char <= 0x39) ||
            (char === 0x2D) ||
            (char === 0x5F));
    }
    static isListChar(char) {
        return (Scanner.isAtomChar(char) ||
            Scanner.isListWildcardChar(char) ||
            Scanner.isResponseSpecialChar(char));
    }
}
Scanner.LINE_TERMINATOR = "\r\n";
exports.Scanner = Scanner;
//# sourceMappingURL=Scanner.js.map