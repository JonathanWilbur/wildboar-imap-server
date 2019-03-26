import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { RenameResponse } from "../StorageDriverResponses";

export
const RENAME_COMMAND = new CommandPlugin(
    "RENAME",
    async (connection : Connection, tag : string) => {
        const command : string = "RENAME";
        connection.scanner.readSpace();
        const existingMailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readSpace();
        const newMailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.rename(connection.authenticatedUser, existingMailboxName, newMailboxName)
        .then((response : RenameResponse) : void => {
            if (response.renamed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);