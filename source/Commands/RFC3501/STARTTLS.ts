import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
import { lexer } from "../../ArgumentLexers/NewLineLexer";

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    connection.writeStatus(tag, "BAD", "", command, "STARTTLS is not supported by this server.");
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;