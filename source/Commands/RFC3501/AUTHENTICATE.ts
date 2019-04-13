import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { LexemeType } from "../../LexemeType";
import { Scanner } from "../../Scanner";
import { ConnectionState } from "../../ConnectionState";

const lexer = function* (scanner : Scanner, currentCommand : Lexeme[]) : IterableIterator<Lexeme> {
    switch (currentCommand.length) {
        case (2): {
            const space : Lexeme | null = scanner.readSpace();
            if (!space) return;
            yield space;
        }
        case (3): {
            const saslMechanism : Lexeme | null = scanner.readSASLMechanism();
            if (!saslMechanism) return;
            yield saslMechanism;
        }
        case (4): {
            const newline : Lexeme | null = scanner.readNewLine();
            if (!newline) return;
            yield newline;
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
};

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    const saslMechanism : string = lexemes[3].toString();
    const saslResponses : Lexeme[] = lexemes.filter((lexeme : Lexeme) : boolean => {
        return (lexeme.type === LexemeType.BASE64);
    });
    const response : object = await connection.server.messageBroker.publishAuthentication(saslMechanism, {
        messages: saslResponses.map((saslResponse : Lexeme) => saslResponse.toString())
    });
    if (!("done" in response))
        throw new Error(`Authentication driver response using mechanism '${saslMechanism}' did not include a "done" field.`);
    if ((<any>response)["done"]) {
        if ("authenticatedUser" in response && typeof (<any>response)["authenticatedUser"] === "string") {
            connection.authenticatedUser = (<any>response)["authenticatedUser"];
            connection.state = ConnectionState.AUTHENTICATED;
            connection.writeOk(tag, command);
        } else {
            connection.writeStatus(tag, "NO", "", command, "Authentication failed.");
        }
        connection.currentCommand = [];
    } else {
        if ("nextChallenge" in response && typeof (<any>response)["nextChallenge"] === "string")
            connection.writeContinuationRequest((<any>response)["nextChallenge"]);
    }
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.NOT_AUTHENTICATED;
export default plugin;