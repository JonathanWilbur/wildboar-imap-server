import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { LsubResponse } from "../StorageDriverResponses";
import { LsubItem } from "../StorageDriverResponses/index";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const LSUB_COMMAND = new CommandPlugin(
    "LSUB",
    async (connection : Connection, tag : string) => {
        const command : string = "LSUB";
        connection.scanner.readSpace();
        const mailboxName : string = await connection.scanner.readAstring();
        console.log(mailboxName);
        connection.scanner.readSpace();
        const referenceName : string = await connection.scanner.readMailboxList();
        console.log(`Reference name: ${referenceName}`);
        connection.scanner.readNewLine();
        connection.server.messageBroker.lsub(connection.authenticatedUser, referenceName, mailboxName)
        .then((response : LsubResponse) : void => {
            response.lsubItems.forEach((lsubItem : LsubItem) : void => {
                connection.socket.write(`* ${command} (${lsubItem.nameAttributes.join(" ")}) "${lsubItem.hierarchyDelimiter}" ${lsubItem.name}\r\n`);
            });
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
)