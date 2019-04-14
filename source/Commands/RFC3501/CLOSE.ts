import { CommandPlugin } from "../../CommandPlugin";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import { handler } from "../../CommandHandlers/SimpleSelectedMailbox";

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.SELECTED;
export default plugin;