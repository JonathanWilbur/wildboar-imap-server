import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";

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

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length !== 4) {
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        return;
    }
    const mailboxName : string = lexemes[3].toString();
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailboxName: mailboxName
        });
    if ("ok" in response && (<any>response)["ok"])
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;