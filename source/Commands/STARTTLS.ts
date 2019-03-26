import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const STARTTLS_COMMAND = new CommandPlugin(
    "STARTTLS",
    async (connection : Connection, tag : string) => {
        const command : string = "STARTTLS";
        connection.scanner.readLine();
        connection.socket.write(`${tag} BAD ${command} not supported.\r\n`);
        connection.scanner.state = ScanningState.COMMAND_NAME;
    }
);