import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const STARTTLS_COMMAND = new CommandPlugin(
    "STARTTLS",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.skipLine();
        connection.socket.write(`${tag} BAD ${command} not supported.\r\n`);
    }
);