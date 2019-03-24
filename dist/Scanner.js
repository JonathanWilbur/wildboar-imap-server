"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
var ScanningState;
(function (ScanningState) {
    ScanningState[ScanningState["COMMAND"] = 0] = "COMMAND";
    ScanningState[ScanningState["LITERAL"] = 1] = "LITERAL";
    ScanningState[ScanningState["DATA_LINE"] = 2] = "DATA_LINE";
})(ScanningState || (ScanningState = {}));
class Scanner {
    constructor() {
        this.receivedData = Buffer.alloc(0);
        this.scanCursor = 0;
        this.currentCommand = [];
        this.state = ScanningState.COMMAND;
    }
    enqueueData(data) {
        this.receivedData = Buffer.concat([this.receivedData.slice(this.scanCursor), data]);
        this.scanCursor = 0;
    }
    scanLine() {
        const indexOfCRLF = this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1)
            return [];
        const ret = [];
        const indexOfFirstSpace = this.receivedData.indexOf(" ", this.scanCursor);
        if (indexOfFirstSpace === -1)
            return [];
        ret.push(new Lexeme_1.default(4, this.receivedData.slice(this.scanCursor, indexOfFirstSpace)));
        const indexOfSecondSpace = this.receivedData.indexOf(" ", (indexOfFirstSpace + 1));
        if (indexOfSecondSpace === -1) {
            ret.push(new Lexeme_1.default(5, this.receivedData.slice(indexOfFirstSpace + 1, indexOfCRLF)));
        }
        else {
            const commandNameSlice = this.receivedData.slice(indexOfFirstSpace + 1, indexOfSecondSpace);
            ret.push(new Lexeme_1.default(5, commandNameSlice));
            const args = this.scanArguments(commandNameSlice.toString(), this.receivedData.slice(indexOfSecondSpace + 1, indexOfCRLF));
            args.forEach((arg) => { ret.push(arg); });
        }
        this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
        return ret;
    }
    scanArguments(command, slice) {
        switch (command.toUpperCase()) {
            case ("CAPABILITY"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("NOOP"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("LOGOUT"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("STARTTLS"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("AUTHENTICATE"): return this.scanAuthenticateArguments(slice);
            case ("LOGIN"): return this.scanLoginArguments(slice);
            case ("SELECT"): return this.scanSelectArguments(slice);
            case ("EXAMINE"): return this.scanExamineArguments(slice);
            case ("CREATE"): return this.scanCreateArguments(slice);
            case ("DELETE"): return this.scanDeleteArguments(slice);
            case ("RENAME"): return this.scanRenameArguments(slice);
            case ("SUBSCRIBE"): return this.scanSubscribeArguments(slice);
            case ("UNSUBSCRIBE"): return this.scanUnsubscribeArguments(slice);
            case ("LIST"): return this.scanListArguments(slice);
            case ("LSUB"): return this.scanLsubArguments(slice);
            case ("STATUS"): return this.scanStatusArguments(slice);
            case ("APPEND"): return this.scanAppendArguments(slice);
            case ("CHECK"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("CLOSE"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("EXPUNGE"): throw new Error(`Arguments are not allowed for the '${command}' command.`);
            case ("SEARCH"): return this.scanSearchArguments(slice);
            case ("FETCH"): return this.scanFetchArguments(slice);
            case ("STORE"): return this.scanStoreArguments(slice);
            case ("COPY"): return this.scanCopyArguments(slice);
            case ("UID"): return this.scanUidArguments(slice);
            default: return [];
        }
    }
    scanAuthenticateArguments(slice) {
        if (!(slice.every(Scanner.isSASLMechanismNameChar)))
            throw new Error("Invalid character in SASL Authentication Mechanism.");
        return [
            new Lexeme_1.default(8, slice)
        ];
    }
    scanLoginArguments(slice) {
        const ret = [];
        let i = 0;
        while (i < slice.length) {
            const nextLexeme = this.scanAstring(slice.slice(i));
            if (nextLexeme.type === 1)
                break;
            ret.push(nextLexeme);
            if (nextLexeme.type === 0)
                break;
            i += (nextLexeme.token.length + ' '.length);
        }
        return ret;
    }
    scanSelectArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanExamineArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanCreateArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanDeleteArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanRenameArguments(slice) {
        const ret = [];
        let i = 0;
        while (i < slice.length) {
            const nextLexeme = this.scanAstring(slice.slice(i));
            if (nextLexeme.type === 1)
                break;
            ret.push(nextLexeme);
            if (nextLexeme.type === 0)
                break;
            i += (nextLexeme.token.length + ' '.length);
        }
        return ret;
    }
    scanSubscribeArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanUnsubscribeArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanListArguments(slice) {
        return [];
    }
    scanLsubArguments(slice) {
        return [];
    }
    scanStatusArguments(slice) {
        return [this.scanAstring(slice)];
    }
    scanAppendArguments(slice) {
        return [];
    }
    scanSearchArguments(slice) {
        return [];
    }
    scanFetchArguments(slice) {
        return [];
    }
    scanStoreArguments(slice) {
        return [];
    }
    scanCopyArguments(slice) {
        return [];
    }
    scanUidArguments(slice) {
        return [];
    }
    scanAstring(slice) {
        if (slice.length === 0)
            return new Lexeme_1.default(1, Buffer.alloc(0));
        if (slice[0] === '"'.charCodeAt(0)) {
            let i = 1;
            let closingQuoteEncountered = false;
            while (i < slice.length) {
                if ((slice[i] === '\r'.charCodeAt(0)) ||
                    (slice[i] === '\n'.charCodeAt(0)))
                    return new Lexeme_1.default(0, Buffer.from("Quoted strings may not have newline characters."));
                if ((slice[i] === '"'.charCodeAt(0)) &&
                    (slice[(i - 1)] !== '\\'.charCodeAt(0))) {
                    closingQuoteEncountered = true;
                    break;
                }
                i++;
            }
            if (!closingQuoteEncountered)
                return new Lexeme_1.default(0, Buffer.from("A double-quoted string did not have a closing quote."));
            return new Lexeme_1.default(9, slice.slice(0, ++i));
        }
        else if (slice[0] === '{'.charCodeAt(0)) {
            let i = 1;
            while (i < slice.length && Scanner.isDigit(slice[i]))
                i++;
            if (slice[i] === '}'.charCodeAt(0))
                return new Lexeme_1.default(10, slice.slice(0, i++));
            else
                return new Lexeme_1.default(0, Buffer.from("A literal length indicator did not end with a '}' as expected."));
        }
        else {
            let i = 0;
            while (i < slice.length && Scanner.isAtomChar(slice[i]))
                i++;
            return new Lexeme_1.default(8, slice.slice(0, i));
        }
    }
    scanCommand() {
        let i = this.scanCursor;
        while (i < this.receivedData.length) {
            const char = this.receivedData[i];
            if (!((char >= 0x41 && char <= 0x5A) ||
                (char >= 0x61 && char <= 0x7A) ||
                (char === 0x5F) ||
                (char === 0x2D) ||
                (char === 0x2E)))
                break;
            i++;
        }
        if (i === this.scanCursor)
            return null;
        this.scanCursor = i;
        return new Lexeme_1.default(5, this.receivedData.slice(0, i));
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
}
Scanner.LINE_TERMINATOR = "\r\n";
exports.default = Scanner;
