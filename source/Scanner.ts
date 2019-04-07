import { Lexeme } from "./Lexeme";
import { LexemeType } from "./LexemeType";

/**
 * A separate class for lexing the raw bytes received from the connection.
 * 
 * All methods that start with 'read' MUST return a `null` if the next
 * lexeme could not be read solely because of non-completion. Returning `null`
 * means "I have not received the rest of this token over the connection yet."
 * 
 * On the other hand, if there is an error, such as a token containing invalid
 * characters, being too long, or terminating prematurely, an error MUST be
 * thrown.
 */
export
class Scanner {

    constructor () {}

    private static readonly LINE_TERMINATOR : string = "\r\n";
    private receivedData : Buffer = Buffer.alloc(0);
    private scanCursor : number = 0;
    private ignoreEverythingUntilNewline : boolean = false;
    public lineReady () : boolean {
        return (this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor) !== -1);
    }

    public enqueueData (data : Buffer) : void {
        if (data.length === 0) return;
        if (this.ignoreEverythingUntilNewline) {
            const indexOfCRLF : number = data.indexOf(Scanner.LINE_TERMINATOR);
            // If the line has not ended yet, just drop the data.
            if (indexOfCRLF === -1) return;
            this.receivedData = data.slice(indexOfCRLF + Scanner.LINE_TERMINATOR.length);
            this.scanCursor = 0;
            this.ignoreEverythingUntilNewline = false;
            return;
        }
        if (this.scanCursor === 0)
            // This is done for performance reasons.
            this.receivedData = Buffer.concat([ this.receivedData, data ]);
        else
            this.receivedData = Buffer.concat([ this.receivedData.slice(this.scanCursor), data ]);
        this.scanCursor = 0;
    }

    /**
     * This is really just a test method for ignoring arguments. This should
     * not be used in production releases.
     */
    public skipLine () : boolean {
        const indexOfCRLF : number =
            this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1) {
            this.ignoreEverythingUntilNewline = true;
            return false;
        } else {
            this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
            return true;
        }
    }

    private readFixedLengthToken (token : Buffer) : boolean {
        if ((this.scanCursor + token.length) > this.receivedData.length)
            return false;
        const indexOfToken : number =
            this.receivedData.indexOf(token, this.scanCursor);
        if (indexOfToken === this.scanCursor) {
            this.scanCursor += token.length;
            return true;
        }
        const troublemaker : Buffer = this.receivedData.slice(
            this.scanCursor,
            (this.scanCursor + token.length)
        );
        throw new Error(`Fixed-length token cannot be read: ${token.join(" ")}. Got ${troublemaker.join(" ")} instead.`);
    }

    private readStatedLengthToken (length : number) : boolean {
        if (this.scanCursor + length > this.receivedData.length)
            return false;
        this.scanCursor = (this.scanCursor + length);
        return true;
    }

    private readExplicitlyTerminatedToken (terminator : Buffer) : boolean {
        const indexOfTerminator : number = 
            this.receivedData.indexOf(terminator, this.scanCursor);
        if (indexOfTerminator === -1) return false;
        this.scanCursor = (indexOfTerminator + terminator.length);
        return true;
    }

    private readImplicitlyTerminatedToken (matcher : (char : number) => boolean) : boolean {
        let indexOfEndOfToken : number = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(matcher(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1) return false;
        // const oldScanCursor : number = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return true;
        // return new Lexeme(
        //     LexemeType.ATOM,
        //     this.receivedData.slice(oldScanCursor, indexOfEndOfToken)
        // );
    }

    public readTag () : Lexeme | null {
        const indexOfFirstSpace : number =
            this.receivedData.indexOf(" ".charCodeAt(0), this.scanCursor);
        if (indexOfFirstSpace === -1) return null;
        if (this.scanCursor === indexOfFirstSpace)
            throw new Error("Tag cannot be zero-length.");
        const tag : Buffer =
            this.receivedData.slice(this.scanCursor, indexOfFirstSpace);
        if (!(tag.every(Scanner.isTagChar)))
            throw new Error("Invalid characters in tag.");
        this.scanCursor = (indexOfFirstSpace + ' '.length);
        return new Lexeme(LexemeType.TAG, tag);
    }

    public readCommand () : Lexeme | null {
        let indexOfEndOfCommand = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfCommand = i;
                break;
            }
        }
        if (indexOfEndOfCommand === -1) return null;
        if (this.scanCursor === indexOfEndOfCommand)
            throw new Error("Command cannot be zero-length.");
        const commandName : Buffer =
            this.receivedData.slice(this.scanCursor, indexOfEndOfCommand);
        if (!(commandName.every(Scanner.isAtomChar)))
            throw new Error("Invalid characters in command name.");
        this.scanCursor = indexOfEndOfCommand;
        return new Lexeme(LexemeType.COMMAND_NAME, commandName);
    }

    public readAstring () : Lexeme | null {
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readAtom();
    }

    public readSpace () : Lexeme | null {
        if (this.readFixedLengthToken(Buffer.from(" ")))
            return new Lexeme(LexemeType.WHITESPACE, Buffer.from(" "));
        else return null;
    }

    public readNewLine () : Lexeme | null {
        if (this.readFixedLengthToken(Buffer.from("\r\n")))
            return new Lexeme(LexemeType.NEWLINE, Buffer.from("\r\n"));
        else return null;
    }

    public readCommandTerminatingNewLine () : Lexeme | null {
        if (this.readFixedLengthToken(Buffer.from("\r\n")))
            return new Lexeme(LexemeType.END_OF_COMMAND, Buffer.from("\r\n"));
        else return null;
    }

    public readDoubleQuotedString () : Lexeme | null {
        let i : number = (this.scanCursor + 1);
        let closingQuoteEncountered : boolean = false;
        while (i < this.receivedData.length) {
            if (
                (this.receivedData[i] === '\r'.charCodeAt(0)) ||
                (this.receivedData[i] === '\n'.charCodeAt(0))
            ) throw new Error("CR or LF not permitted in a double-quoted string.");
            if (
                (this.receivedData[i] === '"'.charCodeAt(0)) &&
                (this.receivedData[(i - 1)] !== '\\'.charCodeAt(0))
            ) {
                closingQuoteEncountered = true;
                break;
            }
            i++;
        }
        if (!closingQuoteEncountered) return null;
            // throw new Error("A double-quoted string did not have a closing quote.");
        const oldScanCursor = this.scanCursor;
        this.scanCursor = (i + 1);
        return new Lexeme(LexemeType.QUOTED_STRING, this.receivedData.slice(oldScanCursor, this.scanCursor));
    }

    public readAtom () : Lexeme | null {
        const oldScanCursor : number = this.scanCursor;
        if (this.readImplicitlyTerminatedToken(Scanner.isAtomChar)) {
            if (this.scanCursor === oldScanCursor)
                throw new Error("Atom cannot be zero-length.");
            return new Lexeme(
                LexemeType.ATOM,
                this.receivedData.slice(oldScanCursor, this.scanCursor)
            );
        } else return null;
    }

    public readLiteralLength () : Lexeme | null {
        if (this.receivedData[this.scanCursor] !== "{".charCodeAt(0))
            return null;
        const oldScanCursor : number = this.scanCursor;
        let i : number = (this.scanCursor + "{".length);
        if (this.readExplicitlyTerminatedToken(Buffer.from("}\r\n"))) {
            while (i < (this.scanCursor - "}\r\n".length)) {
                if (!Scanner.isDigit(this.receivedData[i]))
                    throw new Error(`Non-digit detected in literal length. Character code: ${this.receivedData[i]}.`);
                i++;
            }
            return new Lexeme(
                LexemeType.LITERAL_LENGTH,
                this.receivedData.slice(oldScanCursor, this.scanCursor)
            );
        } else return null;
    }

    // NOTE: This code can possibly be deduped, because it came from readAtom().
    public readList () : Lexeme {
        let indexOfEndOfToken = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isListChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1)
            throw new Error("No end of list encountered.");
        const oldScanCursor = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme(
            LexemeType.ATOM,
            this.receivedData.slice(oldScanCursor, indexOfEndOfToken)
        );
    }

    public readString () : Lexeme | null {
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        throw new Error("The string you attempted to read was neither quoted string, nor a literal.");
    }

    public readMailboxList () : Lexeme | null {
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readList();
    }

    public readLiteral (length : number) : Lexeme | null {
        if (this.readStatedLengthToken(length)) 
            return new Lexeme(
                LexemeType.STRING_LITERAL,
                this.receivedData.slice((this.scanCursor - length), this.scanCursor)
            );
        else return null;
    }

    public readAbortableBase64 () : Lexeme | null {
        if (this.receivedData[this.scanCursor] === '*'.charCodeAt(0)) {
            this.scanCursor++;
            return new Lexeme(LexemeType.ABORT, Buffer.from("*"));
        }
        let indexOfEndOfToken : number = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isBase64Char(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1) return null;
        const oldScanCursor : number = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme(
            LexemeType.BASE64,
            this.receivedData.slice(oldScanCursor, indexOfEndOfToken)
        );
    }

    public readSASLMechanism () : Lexeme | null {
        let indexOfEndOfToken : number = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isSASLMechanismNameChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }
        if (indexOfEndOfToken === -1) return null;
        const oldScanCursor : number = this.scanCursor;
        this.scanCursor = indexOfEndOfToken;
        return new Lexeme(
            LexemeType.SASL_MECHANISM,
            this.receivedData.slice(oldScanCursor, indexOfEndOfToken)
        );
    }

    public static isChar (char : number) : boolean {
        return (char >= 0x01 && char <= 0x7F);
    }

    public static isAtomChar (char : number) : boolean {
        return (
            (Scanner.isChar(char)) &&
            (!(Scanner.isAtomSpecialChar(char)))
        );
    }

    public static isAtomSpecialChar (char : number) : boolean {
        return (
            (char === '('.charCodeAt(0)) ||
            (char === ')'.charCodeAt(0)) ||
            (char === '{'.charCodeAt(0)) ||
            (char === ' '.charCodeAt(0)) ||
            (Scanner.isControlCharacter(char)) ||
            (Scanner.isListWildcardChar(char)) ||
            (Scanner.isQuotedSpecialChar(char)) ||
            (Scanner.isResponseSpecialChar(char))
        );
    }

    public static isControlCharacter (char : number) : boolean {
        return ((char >= 0x00 && char <= 0x1F) || (char === 0x7F));
    }

    public static isTagChar (char : number) : boolean {
        return (Scanner.isAtomChar(char) && char !== '+'.charCodeAt(0));
    }

    public static isDigit (char : number) : boolean {
        return (char >= 0x30 && char <= 0x39);
    }

    public static isNonZeroDigit (char : number) : boolean {
        return (Scanner.isDigit(char) && char !== 0x30);
    }

    public static isAstringChar (char : number) : boolean {
        return (Scanner.isAtomChar(char) || char === "]".charCodeAt(0));
    }

    public static isBase64Char (char : number) : boolean {
        // TODO: Cache this buffer.
        return ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(String.fromCharCode(char)) !== -1);
    }

    public static isWhitespace (char : number) : boolean {
        return (char === 0x20 || char === '\t'.charCodeAt(0));
    }

    public static isListWildcardChar (char : number) : boolean {
        return (char === '%'.charCodeAt(0) || char === '*'.charCodeAt(0));
    }

    public static isQuotedSpecialChar (char : number) : boolean {
        return (char === '"'.charCodeAt(0) || char === '\\'.charCodeAt(0));
    }

    public static isResponseSpecialChar (char : number) : boolean {
        return (char === ']'.charCodeAt(0));
    }

    public static isSASLMechanismNameChar (char : number) : boolean {
        return (
            (char >= 0x41 && char <= 0x5A) ||
            (char >= 0x30 && char <= 0x39) ||
            (char === 0x2D) ||
            (char === 0x5F)
        );
    }

    public static isListChar (char : number) : boolean {
        return (
            Scanner.isAtomChar(char) ||
            Scanner.isListWildcardChar(char) ||
            Scanner.isResponseSpecialChar(char)
        );
    }
}