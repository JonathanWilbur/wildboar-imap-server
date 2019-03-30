import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ConnectionState } from "../ConnectionState";

export
const LOGOUT_COMMAND = new CommandPlugin(
    "LOGOUT",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readNewLine();
        // TODO: Add a configuration directive for the BYE message.
        connection.socket.write(`* BYE (Bye message goes here.)\r\n`);
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        connection.state = ConnectionState.NOT_AUTHENTICATED;
        /**
         * WARNING: I fear that a race condition from a command executing
         * slightly after a user logs out will be a security issue in the
         * future.
         */
        connection.authenticatedUser = "";
        connection.close();
    }
);