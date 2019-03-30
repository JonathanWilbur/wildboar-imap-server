import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { CheckResponse } from "../StorageDriverResponses";

export
const CHECK_COMMAND = new CommandPlugin(
    "CHECK",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readNewLine();
        const response : CheckResponse = await connection.server.messageBroker.check(connection.authenticatedUser);
        if (response.checked) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        connection.scanner.state = ScanningState.LINE;
    }
);