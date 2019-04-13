import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
import { lexer } from "../../ArgumentLexers/NewLineLexer";

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    connection.state = ConnectionState.LOGOUT;
    connection.authenticatedUser = "";
    connection.writeData(`BYE ${connection.server.configuration.imap_server_valediction}`);
    connection.writeOk(tag, command);
    connection.close();
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
export default plugin;