import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { Server } from "../../Server";
import { ConnectionState } from "../../ConnectionState";

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    switch (currentCommand.length) {
        case (2): {
            const space : Lexeme | null = scanner.readSpace();
            if (!space) return;
            yield space;
        }
        case (3): {
            const userid : Lexeme | null = scanner.readAstring();
            if (!userid) return;
            yield userid;
        }
        case (4): {
            const space : Lexeme | null = scanner.readSpace();
            if (!space) return;
            yield space;
        }
        case (5): {
            const password : Lexeme | null = scanner.readAstring();
            if (!password) return;
            yield password;
        }
        case (6): {
            const newline : Lexeme | null = scanner.readCommandTerminatingNewLine();
            if (!newline) return;
            yield newline;
            break;
        }
        default:
            throw new Error("Too many arguments supplied to the LOGIN command.");
    }
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    const credentials : Lexeme[] = lexemes.filter((lexeme : Lexeme) : boolean => {
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
                connection.authenticatedUser = username;
                connection.state = ConnectionState.AUTHENTICATED;
                connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            } else
            connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
        });
    } else {
        const response : object = await connection.server.messageBroker.publishAuthentication("PLAIN", {
            messages: [
                (Buffer.from(`${username}\x00${username}\x00${password}`)).toString("base64")
            ]
        });
        if (!("done" in response))
            throw Error(`Authentication driver response using mechanism 'PLAIN' did not include a "done" field.`);
        if ((<any>response)["done"]) {
            if ("authenticatedUser" in response && typeof (<any>response)["authenticatedUser"] === "string") {
                connection.authenticatedUser = (<any>response)["authenticatedUser"];
                connection.state = ConnectionState.AUTHENTICATED;
                connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
            } else {
                connection.socket.write(`${tag} NO ${command} Incorrect username or password.\r\n`);
            }
        } else {
            // This is not supposed to happen, because the PLAIN
            // authentication mechanism only uses one message.
            connection.socket.write(`${tag} NO ${command} Unexpected error.\r\n`);
        }
    }
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;