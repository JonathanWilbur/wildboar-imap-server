import { Lexeme } from "../Lexeme";
import { Scanner } from "../Scanner";

export
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