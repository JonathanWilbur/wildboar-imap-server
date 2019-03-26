export
enum ScanningState {
    TAG,
    COMMAND_NAME,
    ARGUMENTS,
    CRLF
}

export default
class Scanner {

    private static readonly LINE_TERMINATOR : string = "\r\n";
    private receivedData : Buffer = Buffer.alloc(0);
    private scanCursor : number = 0;
    public state : ScanningState = ScanningState.COMMAND_NAME;
    get lineReady () : boolean {
        return (this.receivedData.indexOf("\r\n") !== -1);
    }

    public enqueueData (data : Buffer) : void {
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
    public readLine () : boolean {
        const indexOfCRLF : number =
            this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1) false;
        this.scanCursor = (indexOfCRLF + "\r\n".length);
        return true;
    }

    public readTag () : Promise<string> {
        console.log(`Debugging from readTag(): receivedData: ${this.receivedData}`);
        const indexOfFirstSpace : number =
            this.receivedData.indexOf(" ".charCodeAt(0), this.scanCursor);
        return new Promise<string>((resolve, reject) : void => {
            if (indexOfFirstSpace === -1) {
                reject(null);
                return;
            }
            const tag : Buffer =
                this.receivedData.slice(this.scanCursor, indexOfFirstSpace);
            if (!(tag.every(Scanner.isTagChar))) {
                reject(new Error("Invalid characters in tag."));
                return;
            }
            this.scanCursor = (indexOfFirstSpace + ' '.length);
            this.state = ScanningState.COMMAND_NAME;
            resolve(tag.toString()); // No chance of UTF8 Errors here, because everything is US-ASCII.
        });
    }

    public readCommand () : Promise<string> {
        let indexOfEndOfCommand = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfCommand = i;
                break;
            }
        }
        
        return new Promise<string>((resolve, reject) : void => {
            if (indexOfEndOfCommand === -1)  {
                reject(null);
                return;
            }
            const commandName : Buffer =
                this.receivedData.slice(this.scanCursor, indexOfEndOfCommand);
            if (!(commandName.every(Scanner.isAtomChar))) {
                reject(new Error("Invalid characters in command name."));
                return;
            }
            this.scanCursor = indexOfEndOfCommand;
            this.state = ScanningState.ARGUMENTS;
            resolve(commandName.toString()); // No chance of UTF8 Errors here, because everything is US-ASCII.
        });
    }

    public readAstring () : Promise<string> {
        if (this.receivedData.length === 0) return Promise.reject(null);
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readAtom();
    }

    public readSpace () : boolean {
        if (this.receivedData[this.scanCursor] === ' '.charCodeAt(0)) {
            this.scanCursor++;
            return true;
        } else return false;
    }

    public readNewLine () : boolean {
        if (this.scanCursor >= this.receivedData.length - 1) return false;
        if (
            this.receivedData[this.scanCursor] === '\r'.charCodeAt(0) &&
            this.receivedData[this.scanCursor + 1] === '\n'.charCodeAt(0)
        ) {
            this.scanCursor += 2;
            return true;
        } else return false;
    }

    public readDoubleQuotedString () : Promise<string> {
        let i : number = (this.scanCursor + 1);
        let closingQuoteEncountered : boolean = false;
        return new Promise<string>((resolve, reject) : void => {
            while (i < this.receivedData.length) {
                if (
                    (this.receivedData[i] === '\r'.charCodeAt(0)) ||
                    (this.receivedData[i] === '\n'.charCodeAt(0))
                ) reject(new Error("CR or LF not permitted in a double-quoted string."));
                if (
                    (this.receivedData[i] === '"'.charCodeAt(0)) &&
                    (this.receivedData[(i - 1)] !== '\\'.charCodeAt(0))
                ) {
                    closingQuoteEncountered = true;
                    break;
                }
                i++;
            }
            if (!closingQuoteEncountered) {
                reject(new Error("A double-quoted string did not have a closing quote."));
                return;
            }
            // console.log(this.receivedData.slice(this.scanCursor + 1, i));
            const ret : string =
                this.receivedData
                .slice(this.scanCursor + 1, i) 
                .toString()
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            resolve(ret);
            this.scanCursor = (i + 1);
        });
    }

    public readAtom () : Promise<string> {
        let indexOfEndOfToken = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isAtomChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }

        return new Promise<string>((resolve, reject) : void => {
            if (indexOfEndOfToken === -1)  {
                reject(null);
                return;
            }
            resolve(this.receivedData.slice(this.scanCursor, indexOfEndOfToken).toString());
            this.scanCursor = indexOfEndOfToken;
        });
    }

    public readLiteralLength () : Promise<string> {
        return new Promise<string>((resolve, reject) : void => {
            resolve(""); // TODO:
        });
    }

    // NOTE: This code can possibly be deduped, because it came from readAtom().
    public readList () : Promise<string> {
        let indexOfEndOfToken = -1;
        for (let i : number = this.scanCursor; i < this.receivedData.length; i++) {
            if (!(Scanner.isListChar(this.receivedData[i]))) {
                indexOfEndOfToken = i;
                break;
            }
        }

        return new Promise<string>((resolve, reject) : void => {
            if (indexOfEndOfToken === -1)  {
                reject(null);
                return;
            }
            resolve(this.receivedData.slice(this.scanCursor, indexOfEndOfToken).toString());
            this.scanCursor = indexOfEndOfToken;
        });
    }

    public readString () : Promise<string> {
        if (this.receivedData.length === 0) return Promise.reject(null);
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return Promise.reject(new Error("The string you attempted to read was neither quoted string, nor a literal."));
    }

    public readMailboxList () : Promise<string> {
        if (this.receivedData.length === 0) return Promise.reject(null);
        if (this.receivedData[this.scanCursor] === '"'.charCodeAt(0))
            return this.readDoubleQuotedString();
        if (this.receivedData[this.scanCursor] === '{'.charCodeAt(0))
            return this.readLiteralLength();
        return this.readList();
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

    public static isListChar (char : number) : boolean {
        return (
            Scanner.isAtomChar(char) ||
            Scanner.isListWildcardChar(char) ||
            Scanner.isResponseSpecialChar(char)
        );
    }
}