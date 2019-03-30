import * as net from "net";
import AMQPMessageBroker from "./MessageBrokers/AMQP";
import ConfigurationSource from "./ConfigurationSource";
import { Connection } from "./Connection";
import MessageBroker from "./MessageBroker";
import TypedKeyValueStore from "./ConfigurationSource";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
const uuidv4 : () => string = require("uuid/v4");
import { CommandPlugin } from "./CommandPlugin";

export
class Server implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public messageBroker! : MessageBroker;

    public readonly supportedSASLAuthenticationMechanisms : string[] = [
        "PLAIN"
    ];

    // public readonly extensions : string[] = [
    //     `AUTH ${this.supportedSASLAuthenticationMechanisms.join(" ")}`
    // ];

    public readonly capabilities : string[] = [
        // These are always required, per RFC 3501, Section 7.2.1.
        "IMAP4rev1",
        "STARTTLS",
        "LOGINDISABLED",
        "AUTH=PLAIN"
    ];

    constructor(
        readonly configuration : TypedKeyValueStore & ConfigurationSource,
        readonly commandPlugins : CommandPlugin[]
    ) {
        this.messageBroker = new AMQPMessageBroker(configuration);
        this.commandPlugins.forEach((plugin : CommandPlugin) : void => {
            console.log(`Loaded plugin for command '${plugin.commandName}'.`);
        });
        net.createServer((socket : net.Socket) : void => {
            const connection : Connection = new Connection(this, socket, this.commandPlugins);
        }).listen(
            this.configuration.imap_server_tcp_listening_port,
            this.configuration.imap_server_ip_bind_address,
            () : void => { console.log("Listening for connections..."); }
        );

        process.on('SIGINT', () : void => {
            console.log("Interrupted. Shutting down.");
            this.messageBroker.closeConnection();
            process.exit();
        });
    }

}