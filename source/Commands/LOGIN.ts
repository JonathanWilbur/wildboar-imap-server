import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

// TODO: Actually implement this.
export
const LOGIN_COMMAND = new CommandPlugin(
    "LOGIN",
    (connection : Connection, tag : string) : void => {
        const command : string = "LOGIN";
        connection.scanner.readLine();
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        connection.scanner.state = ScanningState.COMMAND_NAME;
    }
)