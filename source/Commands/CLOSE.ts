import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { CloseResponse } from "../StorageDriverResponses";

export
const CLOSE_COMMAND = new CommandPlugin(
    "CLOSE",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readNewLine();
        const response : CloseResponse = await connection.server.messageBroker.close(connection.authenticatedUser);
        if (response.closed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    }
);