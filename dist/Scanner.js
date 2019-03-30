"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
var ScanningState;
(function (ScanningState) {
    ScanningState[ScanningState["LINE"] = 0] = "LINE";
    ScanningState[ScanningState["ARGUMENTS"] = 1] = "ARGUMENTS";
})(ScanningState = exports.ScanningState || (exports.ScanningState = {}));
class Scanner {
    constructor() {
        this.receivedData = Buffer.alloc(0);
        this.scanCursor = 0;
        this.state = ScanningState.LINE;
    }
    get lineReady() {
        return (this.receivedData.indexOf("\r\n", this.scanCursor) !== -1);
    }
    enqueueData(data) {
        if (this.scanCursor === 0)
            this.receivedData = Buffer.concat([this.receivedData, data]);
        else
            this.receivedData = Buffer.concat([this.receivedData.slice(this.scanCursor), data]);
        this.scanCursor = 0;
    }
    skipLine() {
        const indexOfCRLF = this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1)
            false;
        this.scanCursor = (indexOfCRLF + "\r\n".length);
        return true;
    }
    readTag() {
        const indexOfFirstSpace = this.receivedData.indexOf(" ".charCodeAt(0), this.scanCursor);
        return new Promise((resolve, reject) => {
            if (indexOfFirstSpace === -1) {
                reject(new Error("No first space."));
                return;
            }
            const tag = this.receivedData.slice(this.scanCursor, indexOfFirstSpace);
            if (!(tag.every(Scanner.isTagChar))) {
                reject(new Error("Invalid characters in tag."));
                return;
            }
            this.scanCursor = (indexOfFirstSpace + ' '.length);
            resolve(new Lexeme_1.Lexeme(4, tag));
        });
    }
    readCommand() {
        let indexOfEndOfCommand = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfCommand = i;
                break;
            }
        }
        return new Promise((resolve, reject) => {
            if (indexOfEndOfCommand === -1) {
                reject(new Error("No end of command."));
                return;
            }
            const commandName = this.receivedData.slice(this.scanCursor, indexOfEndOfCommand);
            if (!(commandName.every(Scanner.isAtomChar))) {
                reject(new Error("Invalid characters in command name."));
                return;
            }
            this.scanCursor = indexOfEndOfCommand;
            resolve(new Lexeme_1.Lexeme(5, commandName));
        });
    }
    readAstring() {
        if (this.receivedData.length === 0)
            return Promise.reject(null);
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
        return new Promise((resolve, reject) => {
            while (i < this.receivedData.length) {
                if ((this.receivedData[i] === '\r'.charCodeAt(0)) ||
                    (this.receivedData[i] === '\n'.charCodeAt(0)))
                    reject(new Error("CR or LF not permitted in a double-quoted string."));
                if ((this.receivedData[i] === '"'.charCodeAt(0)) &&
                    (this.receivedData[(i - 1)] !== '\\'.charCodeAt(0))) {
                    closingQuoteEncountered = true;
                    break;
                }
                i++;
            }
            if (!closingQuoteEncountered) {
                reject(new Error("A double-quoted string did not have a closing quote."));
                return;
            }
            resolve(new Lexeme_1.Lexeme(9, this.receivedData.slice(this.scanCursor)));
            this.scanCursor = (i + 1);
        });
    }
    readAtom() {
        let indexOfEndOfToken = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        return new Promise((resolve, reject) => {
            if (indexOfEndOfToken === -1) {
                reject(null);
                return;
            }
            resolve(new Lexeme_1.Lexeme(8, this.receivedData.slice(this.scanCursor, indexOfEndOfToken)));
            this.scanCursor = indexOfEndOfToken;
        });
    }
    readLiteralLength() {
        const indexOfEndOfLiteralLength = this.receivedData.indexOf("}\r\n", this.scanCursor);
        return new Promise((resolve, reject) => {
            if (indexOfEndOfLiteralLength === -1) {
                reject(null);
                return;
            }
            let i = this.scanCursor;
            while (i < indexOfEndOfLiteralLength) {
                if (!Scanner.isDigit(this.receivedData[i])) {
                    reject(new Error("Non-digit detected in literal length."));
                    return;
                }
                i++;
            }
            resolve(new Lexeme_1.Lexeme(10, this.receivedData.slice(this.scanCursor, (indexOfEndOfLiteralLength + '}\r\n'.length))));
            this.scanCursor = (indexOfEndOfLiteralLength + '}\r\n'.length);
        });
    }
    readList() {
        let indexOfEndOfToken = -1;
        for (let i = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isListChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        return new Promise((resolve, reject) => {
            if (indexOfEndOfToken === -1) {
                reject(null);
                return;
            }
            resolve(new Lexeme_1.Lexeme(8, this.receivedData.slice(this.scanCursor, indexOfEndOfToken)));
            this.scanCursor = indexOfEndOfToken;
        });
    }
    readString() {
        if (this.receivedData.length === 0)
            return Promise.reject(null);
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return Promise.reject(new Error("The string you attempted to read was neither quoted string, nor a literal."));
    }
    readMailboxList() {
        if (this.receivedData.length === 0)
            return Promise.reject(null);
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readList();
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
        return (Buffer.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=").indexOf(char) !== -1);
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
