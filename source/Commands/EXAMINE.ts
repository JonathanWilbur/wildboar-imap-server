import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { ExamineResponse } from "../StorageDriverResponses";
import { Lexeme } from "../Lexeme";

export
const EXAMINE_COMMAND = new CommandPlugin(
    "EXAMINE",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        const response : ExamineResponse =
            await connection.server.messageBroker.examine(connection.authenticatedUser, mailboxName.toString());
        // TODO: Use better checks to determine if it is OK / respond if BAD
        connection.socket.write(
            `* ${response.exists} EXISTS\r\n` +
            `* ${response.recent} RECENT\r\n` +
            `* FLAGS (${response.flags.map((flag : string) => ("\\" + flag)).join(" ")})\r\n` +
            `${tag} OK [READ-ONLY] ${command} Completed.\r\n`
        );
    }
);