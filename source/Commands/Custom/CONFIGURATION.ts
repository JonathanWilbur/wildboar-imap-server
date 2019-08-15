import { CommandPlugin } from "../../CommandPlugin";
import { lexer } from "../../ArgumentLexers/NewLineLexer";
import { ConnectionState } from "../../ConnectionState";
import { Connection } from "../../Connection";

const handler = async (connection : Connection, tag : string, command : string) => {
    connection.writeData(`Commands Requiring Authorization: ${Array.from(connection.server.configuration.imap_server_commands_requiring_authorization).join(", ")}`);
    connection.writeData(`Domain: ${connection.server.configuration.imap_server_domain}`);
    connection.writeData(`Greeting: ${connection.server.configuration.imap_server_greeting}`);
    connection.writeData(`Host Name: ${connection.server.configuration.imap_server_hostname}`);
    connection.writeData(`IP Bind Address: ${connection.server.configuration.imap_server_ip_bind_address}`);
    connection.writeData(`Permitted SASL Mechanisms: ${Array.from(connection.server.configuration.imap_server_permitted_sasl_mechanisms).join(", ")}`);
    connection.writeData(`Server Name: ${connection.server.configuration.imap_server_servername}`);
    connection.writeData(`Listening TCP Port: ${connection.server.configuration.imap_server_tcp_listening_port}`);
    connection.writeData(`TCP Socket Timeout in Milliseconds: ${connection.server.configuration.imap_server_tcp_socket_timeout_in_milliseconds}`);
    connection.writeData(`Valediction: ${connection.server.configuration.imap_server_valediction}`);
    connection.writeData(`Queue Protcol: ${connection.server.configuration.queue_protocol}`);
    connection.writeData(`Queue RPC Message Timeout in Milliseconds: ${connection.server.configuration.queue_rpc_message_timeout_in_milliseconds}`);
    connection.writeData(`Queue Server Host Name: ${connection.server.configuration.queue_server_hostname}`);
    connection.writeData(`Queue Server TCP Port: ${connection.server.configuration.queue_server_tcp_listening_port}`);
    connection.writeData(`Queue Server Username: ${connection.server.configuration.queue_username}`);
    connection.writeData(`Simple Authorization: ${connection.server.configuration.simple_authorization}`);
    connection.writeOk(tag, command);
};

const plugin : CommandPlugin = new CommandPlugin(lexer, handler);
plugin.acceptableConnectionState = ConnectionState.AUTHENTICATED;
export default plugin;