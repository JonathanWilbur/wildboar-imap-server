import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { SelectResponse } from "../StorageDriverResponses";
import { Lexeme } from "../Lexeme";

export
const SELECT_COMMAND = new CommandPlugin(
    "SELECT",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.select(connection.authenticatedUser, mailboxName.toString())
        .then((response : SelectResponse) : void => {
            // TODO: Use better checks to determine if it is OK / respond if BAD
            connection.socket.write(
                `* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag : string) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK ${response.readOnly ? "[READ-ONLY]" : "[READ-WRITE]"} ${command} Completed.\r\n`
            );
        });
    }
);