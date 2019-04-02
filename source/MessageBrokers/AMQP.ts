import ConfigurationSource from "../ConfigurationSource";
import MessageBroker from "../MessageBroker";
import { UniquelyIdentified } from "wildboar-microservices-ts";
import { Channel, ConsumeMessage, Message } from 'amqplib';
import { ExamineResponse, SelectResponse, CreateResponse, DeleteResponse, RenameResponse, SubscribeResponse, UnsubscribeResponse, AppendResponse, CheckResponse, CloseResponse, ExpungeResponse, ListResponse, LsubResponse, StatusResponse, SearchResponse, StoreResponse, CopyResponse, FetchResponse } from "../StorageDriverResponses/index";
import { EventEmitter } from "events";
import { IMAP_STORAGE_COMMANDS } from "../Commands";
import { SequenceSet } from "../SequenceSet";
const amqp = require("amqplib/callback_api");
const uuidv4 : () => string = require("uuid/v4");

// TODO: Add content_type
// TODO: Add expiration, plus setTimeout to fire the events to remove the event handlers.

export default
class AMQPMessageBroker implements MessageBroker, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    
    private readonly server_host! : string;
    private readonly server_port! : number;
    private connection! : any;
    private channel! : any;
    private responseEmitter : EventEmitter = new EventEmitter();

    constructor (
        readonly configuration : ConfigurationSource
    ) {
        this.server_host = configuration.queue_server_hostname;
        this.server_port = configuration.queue_server_tcp_listening_port;
        amqp.connect(`amqp://${this.server_host}:${this.server_port}`, (err : Error, connection : any) => {
            if (err) { console.log(err); return; }
            this.connection = connection;

            connection.createChannel((err : Error, channel : Channel) => {
                if (err) { console.log(err); return; }
                this.channel = channel;

                channel.assertExchange("imap.commands", "direct", { durable: true });
                IMAP_STORAGE_COMMANDS.forEach((command : string) : void => {
                    const responseQueueName : string = `imap.${command}.responses-${this.id}`;
                    channel.assertQueue(`imap.${command}`, { durable: true });
                    channel.bindQueue(`imap.${command}`, "imap.commands", command);
                    // TODO: Make the response queue noAck. I think the @types library is missing that property.
                    channel.assertQueue(responseQueueName, { exclusive: true });
                    channel.consume(responseQueueName, (message : ConsumeMessage | null) : void => {
                        if (!message) return; // TODO: Do something more informative here.
                        // console.log(`Should emit ${message.properties.correlationId}`);
                        this.responseEmitter.emit(message.properties.correlationId, message);
                    }, {
                        noAck: true
                    });
                });

                channel.assertExchange("events", "topic", { durable: true });
                channel.assertQueue("events.imap", { durable: false });
                channel.bindQueue("events.imap", "events", "imap");

                channel.assertExchange("authentication", "direct", { durable: true });
                channel.assertQueue("authentication.responses", { durable: false });
                channel.bindQueue("authentication.responses", "authentication", "authentication.responses");

                // Queues and bindings for the individual SASL mechanisms
                channel.assertQueue("PLAIN", { durable: false });
                channel.bindQueue("PLAIN", "authentication", "authentication.PLAIN");
                channel.assertQueue("EXTERNAL", { durable: false });
                channel.bindQueue("EXTERNAL", "authentication", "authentication.EXTERNAL");
                channel.assertQueue("ANONYMOUS", { durable: false });
                channel.bindQueue("ANONYMOUS", "authentication", "authentication.ANONYMOUS");

                channel.assertQueue("authorization", { durable: false });
                // TODO:
            });
        });
    }

    public publishCommand (authenticatedUser : string, command : string, message : object) : Promise<object> {
        const correlationId : string = `urn:uuid:${uuidv4()}`;

        // This induces a timeout, so that we do not accumulate event listeners
        // if the authenticator misses some authentication requests.
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, 10000); // TODO: Change this to a configurable timeout.

        return new Promise<object>((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response : Message | null) : void => {
                if (!response) {
                    console.log(`IMAP Command '${command}' timed out!`);
                    reject(new Error(`IMAP Command '${command}' timed out!`));
                    return;
                }
                try {
                    resolve(JSON.parse(response.content.toString()));
                } catch (error) {
                    reject(error);
                }
            });

            (<any>message)["command"] = command;

            // This MUST occur AFTER this.responseEmitter.once() to prevent a
            // race condition where the storage driver responds before the
            // event listener is established.
            this.channel.publish("imap.commands", command,
            Buffer.from(JSON.stringify(message)), {
                correlationId: correlationId,
                content_type: "application/json",
                content_encoding: "8bit",
                // expiration: 10000, // TODO: Make this a configurable expiration.
                replyTo: `imap.${command}.responses-${this.id}`
            });
        });
    }

    public publishEvent (topic : string, message : object) : void {
        this.channel.publish("events", topic, Buffer.from(JSON.stringify(message)));
    }

    public closeConnection () : void {
        this.channel.close();
        this.connection.close();
    }

}