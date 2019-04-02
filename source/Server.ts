import * as net from "net";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { CommandPlugin } from "./CommandPlugin";
import { ConfigurationSource } from "./ConfigurationSource";
import { Connection } from "./Connection";
import { MessageBroker } from "./MessageBroker";
import { TypedKeyValueStore } from "./TypedKeyValueStore";
const uuidv4 : () => string = require("uuid/v4");

export
class Server implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

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
        readonly messageBroker : MessageBroker,
        readonly commandPlugins : { [ commandName : string ] : CommandPlugin }
    ) {
        net.createServer((socket : net.Socket) : void => {
            const connection : Connection = new Connection(this, socket);
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