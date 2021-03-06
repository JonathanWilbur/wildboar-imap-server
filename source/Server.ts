import * as crypto from "crypto";
import * as net from "net";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { CommandPlugin } from "./CommandPlugin";
import { ConfigurationSource } from "./ConfigurationSource";
import { Connection } from "./Connection";
import { Logger } from "./Logger";
import { MessageBroker } from "./MessageBroker";
import { TypedKeyValueStore } from "./TypedKeyValueStore";
import { v4 as uuidv4 } from "uuid";

export
class Server implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    /**
     * This is deliberately cached, rather than accessed on the fly, because:
     * 1. It is computationally expensive enough to generate this database that
     *    it could be an inroad to a denial-of-service attack if an attacker
     *    performs a brute-force attack.
     * 2. Accessing it on the fly means that, if an attacker can gain control
     *    of environment variables, he can create accounts surreptitiously.
     *    While this is still true, it is much harder to exploit when this
     *    environment variable is only read before the server even starts
     *    listening.
     */
    public readonly driverlessAuthenticationDatabase : { [ username : string ] : string }
        = this.configuration.driverless_authentication_credentials;

    public static driverlessAuthenticationPasswordSalt : string = "PRESS_F_TO_PAY_RESPECCS";
    public static driverlessAuthenticationHashRounds : number = 100000;
    public static driverlessAuthenticationDesiredHashLengthInBytes = 64;
    public static driverlessAuthenticationKeyedHMACAlgorithm : string = "sha512";

    public get capabilities () : Set<string> {

        let commandCapabilities : Set<string> = new Set<string>();
        for (let [name, plugin] of Object.entries(this.commandPlugins)) {
            plugin.contributesCapabilities.forEach((capability : string) : void => {
                commandCapabilities.add(capability);
            });
        }

        return new Set<string>([
            // These are always required, per RFC 3501, Section 7.2.1.
            "IMAP4rev1",
            // "STARTTLS",
            // "LOGINDISABLED",
            // "AUTH=PLAIN"
        ].concat(
            Array.from(this.configuration.imap_server_permitted_sasl_mechanisms.values())
            .map((mechanism : string) : string => `AUTH=${mechanism}`),
            Array.from(commandCapabilities.values())
        ));
    };

    public readonly connections : Set<Connection> = new Set<Connection>([]);

    constructor(
        readonly configuration : TypedKeyValueStore & ConfigurationSource,
        readonly messageBroker : MessageBroker,
        readonly logger : Logger,
        readonly commandPlugins : { [ commandName : string ] : CommandPlugin }
    ) {
        const listeningSocket : net.Server =
            net.createServer((socket : net.Socket) : void => {
                const connection : Connection = new Connection(this, socket);
            }).listen(
                this.configuration.imap_server_tcp_listening_port,
                this.configuration.imap_server_ip_bind_address,
                () : void => {
                    this.logger.info({
                        message: "Wildboar IMAP server started listening.",
                        address: this.configuration.imap_server_ip_bind_address,
                        port: this.configuration.imap_server_tcp_listening_port,
                        serverID: this.id
                    });
                }
            );

        [
            "SIGTERM",
            "SIGHUP",
            "SIGINT"
        ].forEach((signal : string) : void => {
            process.on(<any>signal, async () => {
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

    public static passwordHash (password : string) : Promise<string> {
        return new Promise<string>((resolve, reject) : void => {
            crypto.pbkdf2(password,
                Server.driverlessAuthenticationPasswordSalt,
                Server.driverlessAuthenticationHashRounds,
                Server.driverlessAuthenticationDesiredHashLengthInBytes,
                Server.driverlessAuthenticationKeyedHMACAlgorithm,
                (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey.toString("hex"));
                }
            );
        });
    }

}