import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { ExpungeResponse } from "../StorageDriverResponses";

export
const EXPUNGE_COMMAND = new CommandPlugin(
    "EXPUNGE",
    async (connection : Connection, tag : string) => {
        const command : string = "EXPUNGE";
        connection.scanner.readNewLine();
        connection.server.messageBroker.expunge(connection.authenticatedUser)
        .then((response : ExpungeResponse) : void => {
            if (response.expunged) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);