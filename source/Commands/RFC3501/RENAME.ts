import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
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
    if (currentCommand.length <= 4) {
        const space : Lexeme | null = scanner.readSpace();
        if (!space) return;
        yield space;
    }
    if (currentCommand.length <= 5) {
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
    if (lexemes.length !== 6) {
        connection.writeStatus(tag, "BAD", "", command, "Bad arguments.");
        return;
    }
    const existingMailboxName : string = lexemes[3].toString();
    const newMailboxName : string = lexemes[5].toString();
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            existingMailboxName: existingMailboxName,
            newMailboxName: newMailboxName
        });
    if ("ok" in response && (<any>response)["ok"]) connection.writeOk(tag, command);
    else connection.writeStatus(tag, "NO", "", command, "Failed.");
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;