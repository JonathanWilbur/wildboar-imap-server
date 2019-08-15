import { CommandPlugin } from "../../CommandPlugin";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import { Connection } from "../../Connection";

// TODO: Check queue connectivity.
const handler = async (connection : Connection, tag : string, command : string) => {
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;