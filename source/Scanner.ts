import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";

export default
class Scanner {

    private static readonly LINE_TERMINATOR : string = "\r\n";
    private receivedData : Buffer = Buffer.alloc(0);
    private scanCursor : number = 0;

    public enqueueData (data : Buffer) : void {
        this.receivedData = Buffer.concat([ this.receivedData.slice(this.scanCursor), data ]);
        this.scanCursor = 0;
    }

    public scanLine () : Lexeme | null {
        const indexOfCRLF : number =
            this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1) return null;
        const lexeme : Lexeme = new Lexeme(
            LexemeType.COMMAND_LINE,
            this.receivedData.slice(this.scanCursor, indexOfCRLF)
        );
        this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
        return lexeme;
    }
}