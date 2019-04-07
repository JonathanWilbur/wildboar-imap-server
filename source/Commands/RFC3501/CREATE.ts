import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { Scanner } from "../../Scanner";

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    if (currentCommand.length <= 2) {
        const space : Lexeme | null = scanner.readSpace();
        if (!space) return;
        yield space;
    }
    if (currentCommand.length <= 3) {
        const mailboxName : Lexeme | null = scanner.readAstring();
        if (!mailboxName) return;
        yield mailboxName;
    }
    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
    if (!newline) return;
    yield newline;
    return;
};

const handler = async (connection : Connection, tag : string, command : string, args : Lexeme[]) => {
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {});
    if ("created" in response && (<any>response)["created"])
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
export default plugin;