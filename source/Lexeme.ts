import { LexemeType } from "./LexemeType";

export
class Lexeme {
    constructor (
        readonly type : LexemeType,
        readonly token : Buffer
    ) {}

    public toString() : string {
        switch (<number>this.type) {
            case (LexemeType.TAG):
            case (LexemeType.ATOM):
            case (LexemeType.STRING_LITERAL):
                return this.token.toString();
            case (LexemeType.COMMAND_NAME): return this.token.toString().toUpperCase();
            case (LexemeType.LIST_START): return "(";
            case (LexemeType.LIST_END): return ")";
            case (LexemeType.QUOTED_STRING): {
                if (this.token.length <= 2) return "";
                return this.token
                    .slice(1, (this.token.length - 1))
                    .toString()
                    .replace(/\\\\/g, '\\')
                    .replace(/\\"/g, '"');
            }
            default: return "";
        }
    }

    public toLiteralLength() : number {
        if (this.type !== LexemeType.LITERAL_LENGTH)
            throw new Error("Invalid Lexeme type: literal length cannot be parsed.");
        const match : RegExpExecArray | null = /^\{(\d+)\}\r\n$/.exec(this.token.toString());
        if (!match) 
            throw new Error("Invalid literal length lexeme. THIS ERROR SHOULD NEVER OCCUR.");
        // TODO: Catch parseInt errors
        return parseInt(match[1]);
    }
}