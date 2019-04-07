import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";

const lexer = function* (scanner : Scanner, currentcommand : Lexeme[]) : IterableIterator<Lexeme> {
    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
    if (!newline) return;
    yield newline;
    return;
};

const handler = (connection : Connection, tag : string, command : string, args : Lexeme[]) : void => {
    connection.state = ConnectionState.LOGOUT;
    connection.authenticatedUser = "";
    connection.socket.write(`* BYE ${connection.server.configuration.imap_server_valediction}\r\n`);
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    connection.close();
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
export default plugin;