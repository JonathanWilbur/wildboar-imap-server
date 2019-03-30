import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { CreateResponse } from "../StorageDriverResponses/CreateResponse";
import { Lexeme } from "../Lexeme";
import { LexemeType } from "../LexemeType";

export
const CREATE_COMMAND = new CommandPlugin(
    "CREATE",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        if (mailboxName.type === LexemeType.LITERAL_LENGTH) {
            const literalLength : number = mailboxName.toLiteralLength();
            if (literalLength > 10) { // TODO: Use a more sensible number.
                connection.socket.write(`${tag} BAD ${command} Failed. Your mailbox name is too long.\r\n`);
                return;
            }

            // - Set the connection state to not process new bytes as commands.
            // - Ensure that `receivedData` is emptied and `scanCursor` is reset to 0.
            // - Set `numberOfLiteralBytesToWaitFor` to, well...
            // - Send the continuation response.
            //   - There is no way to do this from the Scanner, because case-by-case logic
            //     will have to be applied to determine if continuation is appropriate.
            // - All new data that comes in still gets enqueued, but not run as commands.
            // - With each new enqueued chunk, do nothing until the `numberOfLiteralBytesToWaitFor` is exceeded.
            // - Read that many bytes into a new Lexeme, and adjust the scan cursor as normal.
        }
        connection.scanner.readNewLine();
        const response : CreateResponse =
            await connection.server.messageBroker.create(connection.authenticatedUser, mailboxName.toString());
        if (response.created) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    }
);