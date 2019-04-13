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

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    connection.writeStatus(tag, "BAD", "", command, "STARTTLS is not supported by this server.");
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;