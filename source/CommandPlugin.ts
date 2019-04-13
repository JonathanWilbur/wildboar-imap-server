import { Connection } from "./Connection";
import { Lexeme } from "./Lexeme";
import { Scanner } from "./Scanner";
import { ConnectionState } from "./ConnectionState";

export
class CommandPlugin {
    public contributesCapabilities : string[] = [];

    /**
     * `null` means that any state should be acceptable.
     */
    public acceptableConnectionState : ConnectionState | null = null;

    public mayExecuteWhileInConnectionState (state : ConnectionState) : boolean {
        return ((this.acceptableConnectionState === null) || (state === this.acceptableConnectionState));
    }

    constructor (
        readonly argumentsScanner : (scanner : Scanner, currentCommand : Lexeme[]) => IterableIterator<Lexeme>,
        readonly callback : (connection : Connection, tag : string, command : string, args : Lexeme[]) => void
    ) {}
}