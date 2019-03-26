import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { DeleteResponse } from "../StorageDriverResponses";

export
const DELETE_COMMAND = new CommandPlugin(
    "DELETE",
    async (connection : Connection, tag : string) => {
        const command : string = "DELETE";
        connection.scanner.readSpace();
        const mailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.delete(connection.authenticatedUser, mailboxName)
        .then((response : DeleteResponse) : void => {
            if (response.deleted) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);