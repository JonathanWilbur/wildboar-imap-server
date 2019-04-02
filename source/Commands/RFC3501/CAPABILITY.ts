import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Scanner } from "../../Scanner";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";

export default new CommandPlugin(
    function* (scanner : Scanner, currentcommand : Lexeme[]) : IterableIterator<Lexeme> {
        if (scanner.readNewLine())
            yield new Lexeme(LexemeType.END_OF_COMMAND, Buffer.from("\r\n"));
        return;
    },
    (connection : Connection, tag : string, command : string, args : Lexeme[]) : void => {
        connection.socket.write(`* ${command} ${connection.server.capabilities.join(" ")}\r\n`);
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
);