import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { CreateResponse } from "../StorageDriverResponses/CreateResponse";
import { Scanner } from "../Scanner";
import { Lexeme } from "../Lexeme";
import { LexemeType } from "../LexemeType";

export
const CREATE_COMMAND = new CommandPlugin(
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
        const response : CreateResponse =
            await connection.server.messageBroker.create(connection.authenticatedUser, args[0].toString());
        if (response.created) connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
        else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
    }
);