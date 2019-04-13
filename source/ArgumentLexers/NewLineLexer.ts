import { Lexeme } from "../Lexeme";
import { Scanner } from "../Scanner";

export
const lexer = function* (scanner : Scanner, currentcommand : Lexeme[]) : IterableIterator<Lexeme> {
    const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
    if (!newline) return;
    yield newline;
    return;
};