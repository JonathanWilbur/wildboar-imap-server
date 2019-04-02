import { Channel, ConsumeMessage, Message } from 'amqplib';
import { EventEmitter } from "events";
import { URL } from "url";
import { UniquelyIdentified } from "wildboar-microservices-ts";
import { ConfigurationSource } from "../ConfigurationSource";
import { MessageBroker } from "../MessageBroker";
const amqp = require("amqplib/callback_api");
const uuidv4 : () => string = require("uuid/v4");

// TODO: Add content_type
// TODO: Add expiration, plus setTimeout to fire the events to remove the event handlers.

export default
class AMQPMessageBroker implements MessageBroker, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly protocol : string = "amqp";
    private connection! : any;
    private channel! : any;
    private responseEmitter : EventEmitter = new EventEmitter();
    public get queueURI () : URL {
        return new URL(
            this.protocol + "://" +
            this.configuration.queue_server_hostname + ":" +
            this.configuration.queue_server_tcp_listening_port.toString()
        );
    }

    constructor (readonly configuration : ConfigurationSource) {
        amqp.connect(this.queueURI.toString(), (err : Error, connection : any) => {
            if (err) { console.log(err); return; }
            this.connection = connection;

            connection.createChannel((err : Error, channel : Channel) => {
                if (err) { console.log(err); return; }
                this.channel = channel;

                channel.assertExchange("imap.commands", "direct", { durable: true });

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

    public initializeCommandRPCQueue (commandName : string) : void {
        const responseQueueName : string = `imap.${commandName}.responses-${this.id}`;
        this.channel.assertQueue(`imap.${commandName}`, { durable: true });
        this.channel.bindQueue(`imap.${commandName}`, "imap.commands", commandName);
        // TODO: Make the response queue noAck. I think the @types library is missing that property.
        this.channel.assertQueue(responseQueueName, { exclusive: true });
        this.channel.consume(responseQueueName, (message : ConsumeMessage | null) : void => {
            if (!message) return; // TODO: Do something more informative here.
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
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