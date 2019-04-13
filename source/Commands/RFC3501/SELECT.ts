import { CommandPlugin } from "../../CommandPlugin";
import { Connection } from "../../Connection";
import { Lexeme } from "../../Lexeme";
import { ConnectionState } from "../../ConnectionState";
import { lexer } from "../../ArgumentLexers/SimpleMailboxLexer";

const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    if (lexemes.length !== 4) {
        connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
        return;
    }
    const mailboxName : string = lexemes[3].toString();
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailboxName: lexemes[3].toString()
        });
    if ("ok" in response && (<any>response)["ok"]) {
        connection.currentlySelectedMailbox = mailboxName;
        connection.hasWritePermissionOnCurrentlySelectedMailbox = true;
        connection.socket.write(`${tag} OK ${command} Completed.\r\n`);
    } else connection.socket.write(`${tag} NO ${command} Failed.\r\n`);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;