import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { RenameResponse } from "../StorageDriverResponses";
import { Lexeme } from "../Lexeme";

export
const RENAME_COMMAND = new CommandPlugin(
    "RENAME",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const existingMailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readSpace();
        const newMailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.rename(connection.authenticatedUser, existingMailboxName.toString(), newMailboxName.toString())
        .then((response : RenameResponse) : void => {
            if (response.renamed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }
);