import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { DeleteResponse } from "../StorageDriverResponses";
import { Lexeme } from "../Lexeme";

export
const DELETE_COMMAND = new CommandPlugin(
    "DELETE",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        const response : DeleteResponse =
            await connection.server.messageBroker.delete(connection.authenticatedUser, mailboxName.toString());
        if (response.deleted) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    }
);