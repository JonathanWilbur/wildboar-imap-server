import LexemeType from "./LexemeType";

export default
class Lexeme {
    constructor (
        readonly type : LexemeType,
        readonly token : Buffer
    ) {}

    public getTag () : string {
        if (this.type !== LexemeType.COMMAND_LINE) return "";
        if (this.token.length === 0) return "";
        const indexOfFirstSpace : number = this.token.indexOf(" ");
        const command : Buffer = ((indexOfFirstSpace === -1) ?
            this.token : this.token.slice(0, indexOfFirstSpace));
        return command.toString();
    }

    public getCommand () : string {
        if (this.type !== LexemeType.COMMAND_LINE) return "";
        if (this.token.length === 0) return "";
        const subtokens : string[] = this.token.toString().split(/\s+/);
        if (subtokens.length < 2) return "";
        return subtokens[1];
    }

    public getArguments () : string {
        if (this.type !== LexemeType.COMMAND_LINE) return "";
        if (this.token.length === 0) return "";
        const indexOfFirstSpace : number = this.token.indexOf(" ");
        if (indexOfFirstSpace === -1) return "";
        const indexOfSecondSpace : number = this.token.indexOf(" ", indexOfFirstSpace + 1);
        if (indexOfSecondSpace === -1) return "";
        return this.token.toString().slice(indexOfSecondSpace);
    }
}