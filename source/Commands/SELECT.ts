import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { SelectResponse } from "../StorageDriverResponses";

export
const SELECT_COMMAND = new CommandPlugin(
    "SELECT",
    async (connection : Connection, tag : string) => {
        const command : string = "SELECT";
        connection.scanner.readSpace();
        const mailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.select(connection.authenticatedUser, mailboxName)
        .then((response : SelectResponse) : void => {
            // TODO: Use better checks to determine if it is OK / respond if BAD
            connection.socket.write(
                `* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag : string) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK ${response.readOnly ? "[READ-ONLY]" : "[READ-WRITE]"} ${command} Completed.\r\n`
            );
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);