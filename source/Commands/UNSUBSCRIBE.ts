import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { UnsubscribeResponse } from "../StorageDriverResponses";
import { Lexeme } from "../Lexeme";

export
const UNSUBSCRIBE_COMMAND = new CommandPlugin(
    "UNSUBSCRIBE",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.unsubscribe(connection.authenticatedUser, mailboxName.toString())
        .then((response : UnsubscribeResponse) : void => {
            if (response.unsubscribed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }
);