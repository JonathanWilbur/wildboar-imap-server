import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { CloseResponse } from "../StorageDriverResponses";

export
const CLOSE_COMMAND = new CommandPlugin(
    "CLOSE",
    async (connection : Connection, tag : string) => {
        const command : string = "CLOSE";
        connection.scanner.readNewLine();
        connection.server.messageBroker.close(connection.authenticatedUser)
        .then((response : CloseResponse) : void => {
            if (response.closed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);