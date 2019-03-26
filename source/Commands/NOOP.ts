import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const NOOP_COMMAND = new CommandPlugin(
    "NOOP",
    async (connection : Connection, tag : string) => {
        const command : string = "NOOP";
        connection.scanner.readLine();
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        connection.scanner.state = ScanningState.COMMAND_NAME;
    }
);