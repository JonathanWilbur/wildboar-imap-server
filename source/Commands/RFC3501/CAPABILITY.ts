import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { lexer } from "../../ArgumentLexers/NewLineLexer";

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    connection.writeData("CAPABILITY " + Array.from(connection.server.capabilities.values()).join(" "));
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
export default plugin;