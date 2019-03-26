import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { UnsubscribeResponse } from "../StorageDriverResponses";

export
const UNSUBSCRIBE_COMMAND = new CommandPlugin(
    "UNSUBSCRIBE",
    async (connection : Connection, tag : string) => {
        const command : string = "SUBSCRIBE";
        connection.scanner.readSpace();
        const mailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.unsubscribe(connection.authenticatedUser, mailboxName)
        .then((response : UnsubscribeResponse) : void => {
            if (response.unsubscribed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);