import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

// TODO: Actually implement this.
export
const LOGIN_COMMAND = new CommandPlugin(
    "LOGIN",
    (connection : Connection, tag : string, command : string) : void => {
        connection.scanner.skipLine();
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
);