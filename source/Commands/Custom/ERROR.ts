import { CommandPlugin } from "../../CommandPlugin";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import { Connection } from "../../Connection";

const handler = async (connection : Connection, tag : string, command : string) => {
    throw new Error(`Command '${command}' executed by user '${connection.authenticatedUser}'.`);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;