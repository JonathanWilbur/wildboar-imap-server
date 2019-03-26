import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ListResponse } from "../StorageDriverResponses";
import { ListItem } from "../StorageDriverResponses/index";
import { ScanningState } from "../Scanner"; // TODO: Separate this.

export
const LIST_COMMAND = new CommandPlugin(
    "LIST",
    async (connection : Connection, tag : string) => {
        const command : string = "LIST";
        connection.scanner.readSpace();
        const mailboxName : string = await connection.scanner.readAstring();
        connection.scanner.readSpace();
        const referenceName : string = await connection.scanner.readMailboxList();
        connection.scanner.readNewLine();
        connection.server.messageBroker.list(connection.authenticatedUser, referenceName, mailboxName)
        .then((response : ListResponse) : void => {
            response.listItems.forEach((listItem : ListItem) : void => {
                connection.socket.write(`* ${command} (${listItem.nameAttributes.join(" ")}) "${listItem.hierarchyDelimiter}" ${listItem.name}\r\n`);
            });
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
);