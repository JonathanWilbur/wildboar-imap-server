import { CommandPlugin } from "../../CommandPlugin";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import { Connection } from "../../Connection";

const handler = async (connection : Connection, tag : string, command : string) => {
    Array.from(connection.server.connections).forEach((conn : Connection) : void => {
        connection.writeData(
            `USER='${conn.authenticatedUser}' `
            + `FROM=${conn.socketString} `
            + `SINCE=${conn.creationTime.toISOString()} `
            + `STATE=${conn.state} `
            + `ID=${conn.id}`
        );
    });
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;