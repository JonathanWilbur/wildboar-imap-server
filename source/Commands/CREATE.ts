import { CommandPlugin } from "../CommandPlugin";
import Connection from "../Connection";
import { ScanningState } from "../Scanner"; // TODO: Separate this.
import { CreateResponse } from "../StorageDriverResponses/CreateResponse";

export
const CREATE_COMMAND = new CommandPlugin(
    "CREATE",
    async (connection : Connection, tag : string) => {
        const command : string = "CREATE";
        console.log(connection.scanner.readSpace());
        const mailboxName : string = await connection.scanner.readAstring();
        console.log(mailboxName);
        connection.scanner.readNewLine();
        connection.server.messageBroker.create(connection.authenticatedUser, mailboxName)
        .then((response : CreateResponse) : void => {
            if (response.created) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
            connection.scanner.state = ScanningState.COMMAND_NAME;
        });
    }
)