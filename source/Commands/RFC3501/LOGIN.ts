import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { Server } from "../../Server";

export default new CommandPlugin(
    function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
        switch (currentCommand.length) {
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
                yield new Lexeme(LexemeType.ERROR, Buffer.from("Too many arguments."));
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
        const username : string = credentials[0].toString().toLowerCase();
        const password : string = credentials[1].toString();
        connection.server.logger.info({
            message: `Authenticating with username '${credentials[0].toString()}' and password '${credentials[1].toString()}'.`
        });
        if (username in connection.server.driverlessAuthenticationDatabase) {
            Server.passwordHash(password).then((passhash : string) : void => {
                if (connection.server.driverlessAuthenticationDatabase[username] === passhash) {
                    connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
                    connection.authenticatedUser = username;
                } else
                connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
            });
        } else {
            connection.server.messageBroker.publishAuthentication("PLAIN", {
                messages: [
                    (Buffer.from(`${username}\x00${username}\x00${password}`)).toString("base64")
                ]
            })
            .then((response : object) => {
                if (!("done" in response))
                    throw Error(`Authentication driver response using mechanism 'PLAIN' did not include a "done" field.`);
                if ((<any>response)["done"]) {
                    if ("authenticatedUser" in response && typeof (<any>response)["authenticatedUser"] === "string") {
                        connection.authenticatedUser = (<any>response)["authenticatedUser"];
                        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
                    } else {
                        connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
                    }
                } else {
                    // TODO: Loop.
                    connection.socket.write(`${tag} NO ${command} Unexpected error.\r\n`);
                }
            });
        }
    }
);