import { Connection } from "./Connection";
import { Lexeme } from "./Lexeme";
import { Scanner } from "./Scanner";

export
class CommandPlugin {
    public contributesCapabilities : string[] = [];
    constructor (
        readonly argumentsScanner : (scanner : Scanner, currentCommand : Lexeme[]) => IterableIterator<Lexeme>,
        readonly callback : (connection : Connection, tag : string, command : string, args : Lexeme[]) => void
    ) {}
}