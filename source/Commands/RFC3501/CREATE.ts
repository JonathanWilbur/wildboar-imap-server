import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";

export default new CommandPlugin(
    function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
        if (currentCommand.length <= 2) {
            if (scanner.readSpace())
                yield new Lexeme(LexemeType.WHITESPACE, Buffer.from(" "));
        }
        if (currentCommand.length <= 3) {
            const mailboxName : Lexeme | null = scanner.readAstring();
            if (!mailboxName) return;
            yield mailboxName;
        }
        if (scanner.readNewLine())
            yield new Lexeme(LexemeType.END_OF_COMMAND, Buffer.from("\r\n"));
        return;
    },
    async (connection : Connection, tag : string, command : string, args : Lexeme[]) => {
        const response : object =
            await connection.server.messageBroker.publishCommand("", command, {});
        if ("created" in response && (<any>response)["created"])
            connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    }
);