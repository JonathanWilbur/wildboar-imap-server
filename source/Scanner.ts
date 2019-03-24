import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";

enum ScanningState {
    COMMAND,
    LITERAL,
    DATA_LINE // Mostly for AUTHENTICATE
}

export default
class Scanner {

    private static readonly LINE_TERMINATOR : string = "\r\n";
    private receivedData : Buffer = Buffer.alloc(0);
    private scanCursor : number = 0;
    private currentCommand : Lexeme[] = [];
    private state : ScanningState = ScanningState.COMMAND;

    public enqueueData (data : Buffer) : void {
        this.receivedData = Buffer.concat([ this.receivedData.slice(this.scanCursor), data ]);
        this.scanCursor = 0;
    }

    // TODO: Make this a Promise
    // public getNextCommand () : Lexeme[] {
    //     let lexemes : Lexeme[] = [];
    //     while (true) {
    //         switch (<number>this.state) {
    //             case (ScanningState.COMMAND):  lexemes = this.scanLine(); break;
    //             // case (ScanningState.LITERAL):  lexemes = this.scanLine(); break;
    //             // TODO: Do something sensible with the default.
    //         }
    //         if (lexemes.length === 0) break;
    //         lexemes.forEach((lexeme : Lexeme) : void => { this.currentCommand.push(lexeme); });
    //         this.currentCommand.push(new Lexeme(LexemeType.NEWLINE, Buffer.from("\r\n")));
    //     };
    //     if (this.currentCommand.length < 3) return []; // You need at least two lexemes: TAG, COMMAND_NAME, and NEWLINE.
    //     if (this.currentCommand[0].type !== LexemeType.TAG) {

    //     }
    //     if (this.currentCommand[1].type !== LexemeType.COMMAND_NAME) {

    //     }
    //     if (this.currentCommand[this.currentCommand.length - 1].type !== LexemeType.NEWLINE) {

    //     }
    //     if (this.state !== ScanningState.COMMAND) {
    //         // Then we still are not fully done with reading the LITERAL.
    //     }
    //     return this.currentCommand;
    // }

    /**
     * @returns An empty array if it is a blank line or if not a line.
     */
    public scanLine () : Lexeme[] {
        const indexOfCRLF : number =
            this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1) return [];
        const ret : Lexeme[] = [];
        const indexOfFirstSpace : number =
            this.receivedData.indexOf(" ", this.scanCursor);
        if (indexOfFirstSpace === -1) return [];
        // TODO: Validate TAG
        ret.push(new Lexeme(
            LexemeType.TAG,
            this.receivedData.slice(this.scanCursor, indexOfFirstSpace)
        ));
        const indexOfSecondSpace : number =
            this.receivedData.indexOf(" ", (indexOfFirstSpace + 1));
        if (indexOfSecondSpace === -1) {
            // TODO: Validate COMMAND_NAME
            ret.push(new Lexeme(
                LexemeType.COMMAND_NAME,
                this.receivedData.slice(indexOfFirstSpace + 1, indexOfCRLF)
            ));
            // Then we are done.
        } else {
            // TODO: Validate COMMAND_NAME
            const commandNameSlice : Buffer =
                this.receivedData.slice(indexOfFirstSpace + 1, indexOfSecondSpace);
            ret.push(new Lexeme(
                LexemeType.COMMAND_NAME,
                commandNameSlice
            ));
            // Then parse arguments.
            const args : Lexeme[] = this.scanArguments(
                commandNameSlice.toString(),
                this.receivedData.slice(indexOfSecondSpace + 1, indexOfCRLF)
            );
            args.forEach((arg : Lexeme) : void => { ret.push(arg); });
        }
        this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
        return ret;
    }

    private scanArguments (command : string, slice : Buffer) : Lexeme[] {
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

    private scanAuthenticateArguments (slice : Buffer) : Lexeme[] {
        if (!(slice.every(Scanner.isSASLMechanismNameChar)))
            throw new Error("Invalid character in SASL Authentication Mechanism.");
        return [
            new Lexeme(
                LexemeType.UNQUOTED_STRING,
                slice
            )
        ];
    }

    private scanLoginArguments (slice : Buffer) : Lexeme[] {
        const ret : Lexeme[] = [];
        let i : number = 0;
        while (i < slice.length) {
            const nextLexeme : Lexeme = this.scanAstring(slice.slice(i));
            if (nextLexeme.type === LexemeType.EMPTY) break;
            ret.push(nextLexeme);
            if (nextLexeme.type === LexemeType.ERROR) break;
            i += (nextLexeme.token.length + ' '.length); 
        }
        return ret;
    }

    private scanSelectArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanExamineArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanCreateArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanDeleteArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanRenameArguments (slice : Buffer) : Lexeme[] {
        const ret : Lexeme[] = [];
        let i : number = 0;
        while (i < slice.length) {
            const nextLexeme : Lexeme = this.scanAstring(slice.slice(i));
            if (nextLexeme.type === LexemeType.EMPTY) break;
            ret.push(nextLexeme);
            if (nextLexeme.type === LexemeType.ERROR) break;
            i += (nextLexeme.token.length + ' '.length); 
        }
        return ret;
    }

    private scanSubscribeArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanUnsubscribeArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanListArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanLsubArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanStatusArguments (slice : Buffer) : Lexeme[] {
        return [ this.scanAstring(slice) ];
    }

    private scanAppendArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanSearchArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanFetchArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanStoreArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanCopyArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanUidArguments (slice : Buffer) : Lexeme[] {
        return [];
    }

    private scanAstring (slice : Buffer) : Lexeme {
        if (slice.length === 0)
            return new Lexeme(LexemeType.EMPTY, Buffer.alloc(0));
        if (slice[0] === '"'.charCodeAt(0)) { // quoted
            let i : number = 1;
            let closingQuoteEncountered : boolean = false;
            while (i < slice.length) {
                if (
                    (slice[i] === '\r'.charCodeAt(0)) ||
                    (slice[i] === '\n'.charCodeAt(0))
                ) return new Lexeme(
                    LexemeType.ERROR,
                    Buffer.from("Quoted strings may not have newline characters.")
                );
                if (
                    (slice[i] === '"'.charCodeAt(0)) &&
                    (slice[(i - 1)] !== '\\'.charCodeAt(0))
                ) {
                    closingQuoteEncountered = true;
                    break;
                }
                i++;
            }
            if (!closingQuoteEncountered)
                return new Lexeme(
                    LexemeType.ERROR,
                    Buffer.from("A double-quoted string did not have a closing quote.")
                );
            return new Lexeme(LexemeType.QUOTED_STRING, slice.slice(0, ++i));
        } else if (slice[0] === '{'.charCodeAt(0)) { // literal
            let i : number = 1;
            while (i < slice.length && Scanner.isDigit(slice[i])) i++;
            if (slice[i] === '}'.charCodeAt(0))
                return new Lexeme(LexemeType.LITERAL_LENGTH, slice.slice(0, i++));
            else
                return new Lexeme(
                    LexemeType.ERROR,
                    Buffer.from("A literal length indicator did not end with a '}' as expected.")
                );
        } else {
            let i : number = 0;
            while (i < slice.length && Scanner.isAtomChar(slice[i])) i++;
            return new Lexeme(LexemeType.UNQUOTED_STRING, slice.slice(0, i));
        }
    }

    /**
     * Returns a command token, if one can be lexed.
     * 
     * Though the permitted syntax for commands is very liberal, this only permits
     * uppercase and lowercase US-ASCII letters, dash, period, and underscore
     * for commands for security and performance reasons. It is important to
     * permit lowercase letters, because some libraries use lowercase commands.
     * I could not find any RFCs that extend the syntax of commands.
     */
    public scanCommand () : Lexeme | null {
        let i : number = this.scanCursor;
        while (i < this.receivedData.length) {
            const char : number = this.receivedData[i];
            if (!(
                (char >= 0x41 && char <= 0x5A) || // A - Z
                (char >= 0x61 && char <= 0x7A) || // a - z
                (char === 0x5F) || // _
                (char === 0x2D) || // -
                (char === 0x2E)    // .
            )) break;
            i++;
        }
        if (i === this.scanCursor) return null;
        this.scanCursor = i;
        return new Lexeme(LexemeType.COMMAND_NAME, this.receivedData.slice(0, i));
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
        return (Buffer.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=").indexOf(char) !== -1);
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
}