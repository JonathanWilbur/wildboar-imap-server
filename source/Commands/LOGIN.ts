import { CommandPlugin } from "../CommandPlugin";
import { Connection } from "../Connection";
import { Scanner } from "../Scanner";
import { Lexeme } from "../Lexeme";
import { LexemeType } from "../LexemeType";

// TODO: Actually implement this.
export
const LOGIN_COMMAND = new CommandPlugin(
    function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
        // We skip literals for counting the number of arguments, because they are added
        // after the literal length indicators.
        const nonLiterals : Lexeme[] = currentCommand.filter((lexeme : Lexeme) : boolean => 
            { return (lexeme.type !== LexemeType.STRING_LITERAL); }
        );
        switch (nonLiterals.length) {
            case (2): {
                if (scanner.readSpace())
                    yield new Lexeme(LexemeType.WHITESPACE, Buffer.from(" "));
            }
            case (3): {
                const userid : Lexeme | null = scanner.readAstring();
                if (!userid) return;
                yield userid;
            }
            case (4): {
                if (scanner.readSpace())
                    yield new Lexeme(LexemeType.WHITESPACE, Buffer.from(" "));
            }
            case (5): {
                const password : Lexeme | null = scanner.readAstring();
                if (!password) return;
                yield password;
            }
            case (6): {
                if (scanner.readNewLine())
                    yield new Lexeme(LexemeType.END_OF_COMMAND, Buffer.from("\r\n"));
                break;
            }
            default: {
                scanner.skipLine();
                // TODO: Report an error.
            }
        }
    },
    (connection : Connection, tag : string, command : string, args : Lexeme[]) : void => {
        const credentials : Lexeme[] = args.filter((lexeme : Lexeme) : boolean => {
            return (
                lexeme.type === LexemeType.ATOM ||
                lexeme.type === LexemeType.QUOTED_STRING ||
                lexeme.type === LexemeType.STRING_LITERAL
            );
        });
        console.log(`Authenticating with username '${credentials[0].toString()}' and password '${credentials[1].toString()}'.`);
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
);