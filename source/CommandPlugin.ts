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

    // private _acceptableConnectionStatesBitFlags : number = (
    //     ConnectionState.NOT_AUTHENTICATED |
    //     ConnectionState.AUTHENTICATED |
    //     ConnectionState.SELECTED |
    //     ConnectionState.LOGOUT
    // );

    // get acceptableConnectionStatesBitFlags () : number {
    //     return this._acceptableConnectionStatesBitFlags;
    // }

    // public prohibitThisCommandWhileInConnectionState (state : ConnectionState) : void {
    //     this._acceptableConnectionStatesBitFlags &= (~state);
    // }

    public mayExecuteWhileInConnectionState (state : ConnectionState) : boolean {
        return ((this.acceptableConnectionState === null) || (state === this.acceptableConnectionState));
    }

    constructor (
        readonly argumentsScanner : (scanner : Scanner, currentCommand : Lexeme[]) => IterableIterator<Lexeme>,
        readonly callback : (connection : Connection, tag : string, command : string, args : Lexeme[]) => void
    ) {}
}