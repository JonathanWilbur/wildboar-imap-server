import { Connection } from "../Connection";
import { Lexeme } from "../Lexeme";

export
const handler = async (connection : Connection, tag : string, command : string, lexemes : Lexeme[]) => {
    const response : object =
        await connection.server.messageBroker.publishCommand(connection.authenticatedUser, command, {
            mailbox: connection.currentlySelectedMailbox
        });
    if ("ok" in response && (<any>response)["ok"]) connection.writeOk(tag, command);
    else connection.writeStatus(tag, "NO", "", command, "Failed.");
};