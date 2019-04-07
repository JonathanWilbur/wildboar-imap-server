"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const net = require("net");
const Connection_1 = require("./Connection");
const uuid_1 = require("uuid");
class Server {
    constructor(configuration, messageBroker, logger, commandPlugins) {
        this.configuration = configuration;
        this.messageBroker = messageBroker;
        this.logger = logger;
        this.commandPlugins = commandPlugins;
        this.id = `urn:uuid:${uuid_1.v4()}`;
        this.creationTime = new Date();
        this.driverlessAuthenticationDatabase = this.configuration.driverless_authentication_credentials;
        const listeningSocket = net.createServer((socket) => {
            const connection = new Connection_1.Connection(this, socket);
        }).listen(this.configuration.imap_server_tcp_listening_port, this.configuration.imap_server_ip_bind_address, () => {
            this.logger.info({
                message: "Wildboar IMAP server started listening.",
                address: this.configuration.imap_server_ip_bind_address,
                port: this.configuration.imap_server_tcp_listening_port,
                serverID: this.id
            });
        });
        [
            "SIGTERM",
            "SIGHUP",
            "SIGINT"
        ].forEach((signal) => {
            process.on(signal, async () => {
                this.logger.info({
                    topic: "signals",
                    message: `Received signal ${signal}. Shutting down server with id ${this.id} gracefully.`,
                    signal: signal,
                    server: this.id
                });
                await listeningSocket.close();
                await this.configuration.close();
                await this.messageBroker.closeConnection();
                await this.logger.close();
                process.exit(0);
            });
        });
    }
    get capabilities() {
        let commandCapabilities = new Set();
        for (let [name, plugin] of Object.entries(this.commandPlugins)) {
            plugin.contributesCapabilities.forEach((capability) => {
                commandCapabilities.add(capability);
            });
        }
        return new Set([
            "IMAP4rev1",
        ].concat(Array.from(this.configuration.imap_server_permitted_sasl_mechanisms.values())
            .map((mechanism) => `AUTH=${mechanism}`), Array.from(commandCapabilities.values())));
    }
    ;
    static passwordHash(password) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, Server.driverlessAuthenticationPasswordSalt, Server.driverlessAuthenticationHashRounds, Server.driverlessAuthenticationDesiredHashLengthInBytes, Server.driverlessAuthenticationKeyedHMACAlgorithm, (err, derivedKey) => {
                if (err)
                    reject(err);
                else
                    resolve(derivedKey.toString("hex"));
            });
        });
    }
}
Server.driverlessAuthenticationPasswordSalt = "PRESS_F_TO_PAY_RESPECCS";
Server.driverlessAuthenticationHashRounds = 100000;
Server.driverlessAuthenticationDesiredHashLengthInBytes = 64;
Server.driverlessAuthenticationKeyedHMACAlgorithm = "sha512";
exports.Server = Server;
//# sourceMappingURL=Server.js.map