"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const AMQP_1 = require("./MessageBrokers/AMQP");
const Connection_1 = require("./Connection");
const uuidv4 = require("uuid/v4");
class Server {
    constructor(configuration, commandPlugins) {
        this.configuration = configuration;
        this.commandPlugins = commandPlugins;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.supportedSASLAuthenticationMechanisms = [
            "PLAIN"
        ];
        this.capabilities = [
            "IMAP4rev1",
            "STARTTLS",
            "LOGINDISABLED",
            "AUTH=PLAIN"
        ];
        this.messageBroker = new AMQP_1.default(configuration);
        this.commandPlugins.forEach((plugin) => {
            console.log(`Loaded plugin for command '${plugin.commandName}'.`);
        });
        net.createServer((socket) => {
            const connection = new Connection_1.Connection(this, socket, this.commandPlugins);
        }).listen(this.configuration.imap_server_tcp_listening_port, this.configuration.imap_server_ip_bind_address, () => { console.log("Listening for connections..."); });
        process.on('SIGINT', () => {
            console.log("Interrupted. Shutting down.");
            this.messageBroker.closeConnection();
            process.exit();
        });
    }
}
exports.Server = Server;
