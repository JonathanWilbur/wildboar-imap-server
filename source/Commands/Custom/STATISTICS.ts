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
    connection.writeData(`Connection Socket String: ${connection.socketString}`);
    connection.writeData(`Connection Commands Executed: ${connection.commandsExecuted}`);
    connection.writeData(`Connection Authentication Attempts: ${connection.authenticationAttempts}`);
    connection.writeData(`Connection Authorization Failures: ${connection.authorizationFailures}`);
    connection.writeData(`Connection Invalid State Errors: ${connection.invalidStateErrors}`);
    connection.writeData(`Connection Tag Read Failures: ${connection.tagReadFailures}`);
    connection.writeData(`Connection Unknown Command Errors: ${connection.unknownCommandsAttempted}`);
    connection.writeData(`Connection Command Execution Errors: ${connection.commandExecutionErrors}`);
    connection.writeData(`Connection Bad Argument Errors: ${connection.badArgumentFailures}`);
    connection.writeData(`Server ID: ${connection.server.id}`);
    connection.writeData(`Server Creation Time: ${connection.server.creationTime.toISOString()}`);
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;