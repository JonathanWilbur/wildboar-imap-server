import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { Scanner } from "../../Scanner";

export default new CommandPlugin(
    function* (scanner : Scanner, currentcommand : Lexeme[]) : IterableIterator<Lexeme> {
        const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
        if (!newline) return;
        yield newline;
        return;
    },
    (connection : Connection, tag : string, command : string, args : Lexeme[]) : void => {
        connection.socket.write(`* ${command} ${Array.from(connection.server.capabilities.values()).join(" ")}\r\n`);
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
);