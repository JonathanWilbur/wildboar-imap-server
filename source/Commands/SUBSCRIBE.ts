import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { SubscribeResponse } from "../StorageDriverResponses";

export
const SUBSCRIBE_COMMAND = new CommandPlugin(
    "SUBSCRIBE",
    async (connection : Connection, tag : string) => {
        const command : string = "SUBSCRIBE";
        connection.scanner.readSpace();
        const mailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.subscribe(connection.authenticatedUser, mailboxName)
        .then((response : SubscribeResponse) : void => {
            if (response.subscribed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);