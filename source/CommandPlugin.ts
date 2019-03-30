import { Connection } from "./Connection";
import { Lexeme } from "./Lexeme";
import { Scanner } from "./Scanner";

export
class CommandPlugin {
    constructor (
        readonly commandName : string,
        // readonly argumentsScanner : (scanner : Scanner) => Lexeme[],
        readonly callback : (connection : Connection, tag : string, command : string) => void
    ) {}
}