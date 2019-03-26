import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const CAPABILITY_COMMAND = new CommandPlugin(
    "CAPABILITY",
    (connection : Connection, tag : string) : void => {
        const command : string = "CAPABILITY";
        connection.scanner.readNewLine();
        connection.socket.write(`* ${command} ${connection.server.capabilities.join(" ")}\r\n`);
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        connection.scanner.state = ScanningState.COMMAND_NAME;
    }
);