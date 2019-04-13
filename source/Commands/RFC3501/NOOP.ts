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

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
export default plugin;