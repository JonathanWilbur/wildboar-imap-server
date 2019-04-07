import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { Scanner } from "../../Scanner";

const lexer = function* (scanner : Scanner, currentcommand : Lexeme[]) : IterableIterator<Lexeme> {
    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
    if (!newline) return;
    yield newline;
    return;
};

const handler = (connection : Connection, tag : string, command : string, args : Lexeme[]) : void => {
    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
export default plugin;