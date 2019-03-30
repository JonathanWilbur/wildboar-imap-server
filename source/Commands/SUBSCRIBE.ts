import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { SubscribeResponse } from "../StorageDriverResponses";
import { Lexeme } from "../Lexeme";

export
const SUBSCRIBE_COMMAND = new CommandPlugin(
    "SUBSCRIBE",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readNewLine();
        connection.server.messageBroker.subscribe(connection.authenticatedUser, mailboxName.toString())
        .then((response : SubscribeResponse) : void => {
            if (response.subscribed) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }
);