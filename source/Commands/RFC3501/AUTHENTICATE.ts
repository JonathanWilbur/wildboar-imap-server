import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { Server } from "../../Server";

/*
The scanner will scan all the way to the end of the command.
*/

export default new CommandPlugin(
    function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
        switch (currentCommand.length) {
            case (2): {
                if (scanner.readSpace())
                    yield new Lexeme(LexemeType.WHITESPACE, Buffer.from(" "));
            }
            case (3): {
                const saslMechanism : Lexeme | null = scanner.readSASLMechanism();
                if (!saslMechanism) return;
                yield saslMechanism;
            }
            case (4): {
                if (scanner.readNewLine())
                    yield new Lexeme(LexemeType.NEWLINE, Buffer.from("\r\n"));
            }
            default: {
                if (currentCommand[currentCommand.length - 1].type === LexemeType.NEWLINE) {
                    const saslMessage : Lexeme | null = scanner.readAbortableBase64();
                    if (!saslMessage) return;
                    yield saslMessage;
                } else {
                    if (scanner.readNewLine())
                        yield new Lexeme(LexemeType.NEWLINE, Buffer.from("\r\n"));
                    else return;
                }
            }
        }
    },
    (connection : Connection, tag : string, command : string, args : Lexeme[]) : void => {
        const saslMechanism : string = args[3].toString();
        const saslResponses : Lexeme[] = args.filter((lexeme : Lexeme) : boolean => {
            return (lexeme.type === LexemeType.BASE64);
        });
        connection.server.messageBroker.publishAuthentication(saslMechanism, {
            messages: saslResponses.map((saslResponse : Lexeme) => saslResponse.toString())
        })
        .then((response : object) => {
            if (!("done" in response))
                throw Error(`Authentication driver response using mechanism '${saslMechanism}' did not include a "done" field.`);
            if ((<any>response)["done"]) {
                if ("authenticatedUser" in response && typeof (<any>response)["authenticatedUser"] === "string") {
                    connection.authenticatedUser = (<any>response)["authenticatedUser"];
                    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
                } else {
                    connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
                }
                connection.currentCommand = [];
            } else {
                if ("nextChallenge" in response && typeof (<any>response)["nextChallenge"] === "string")
                connection.socket.write(`+ ${(<any>response)["nextChallenge"]}\r\n`);
            }
        });
    }
);