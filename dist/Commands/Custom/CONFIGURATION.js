"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const ConnectionState_1 = require("../../ConnectionState");
const handler = async (connection, tag, command) => {
    connection.writeData(`Commands requiring authentication: ${Array.from(connection.server.configuration.imap_server_commands_requiring_authorization).join(", ")}`);
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
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.AUTHENTICATED;
exports.default = plugin;
//# sourceMappingURL=CONFIGURATION.js.map