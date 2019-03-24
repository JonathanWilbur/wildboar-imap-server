import LexemeType from "./LexemeType";

export default
class Lexeme {
    constructor (
        readonly type : LexemeType,
        readonly token : Buffer
    ) {}

    public toString() : string {
        switch (<number>this.type) {
            case (LexemeType.COMMAND_NAME): return this.token.toString();
            case (LexemeType.LIST_START): return "(";
            case (LexemeType.LIST_END): return ")";
            case (LexemeType.UNQUOTED_STRING): return this.token.toString();
            case (LexemeType.QUOTED_STRING): return this.token.toString().replace("\\", "");
            default: return "";
        }
    }
}