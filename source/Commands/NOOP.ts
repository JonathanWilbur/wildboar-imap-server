import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const NOOP_COMMAND = new CommandPlugin(
    "NOOP",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.skipLine();
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
);