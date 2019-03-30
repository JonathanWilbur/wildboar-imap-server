import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { LsubResponse } from "../StorageDriverResponses";
import { LsubItem } from "../StorageDriverResponses/index";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { Lexeme } from "../Lexeme";

export
const LSUB_COMMAND = new CommandPlugin(
    "LSUB",
    async (connection : Connection, tag : string, command : string) => {
        connection.scanner.readSpace();
        const mailboxName : Lexeme = await connection.scanner.readAstring();
        connection.scanner.readSpace();
        const referenceName : Lexeme = await connection.scanner.readMailboxList();
        connection.scanner.readNewLine();
        connection.server.messageBroker.lsub(connection.authenticatedUser, referenceName.toString(), mailboxName.toString())
        .then((response : LsubResponse) : void => {
            response.lsubItems.forEach((lsubItem : LsubItem) : void => {
                connection.socket.write(`* ${command} (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}\r\n`);
            });
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        });
    }
);