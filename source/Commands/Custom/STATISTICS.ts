import { CommandPlugin } from "../../CommandPlugin";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import { Connection } from "../../Connection";

const handler = async (connection : Connection, tag : string, command : string) => {
    connection.writeData(`Connection ID: ${connection.id}`);
    connection.writeData(`Connection Creation Time: ${connection.creationTime.toISOString()}`);
    connection.writeData(`Connection Authenticated User: ${connection.authenticatedUser}`);
    connection.writeData(`Connection Selected Mailbox: ${connection.currentlySelectedMailbox}`);
    connection.writeData(`Connection State: ${connection.state}`);
    connection.writeData(`Server ID: ${connection.server.id}`);
    connection.writeData(`Server Creation Time: ${connection.server.creationTime.toISOString()}`);
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;