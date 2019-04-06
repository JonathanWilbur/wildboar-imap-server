import { connect, Channel, Connection, ConsumeMessage, Message, Replies } from 'amqplib';
import { EventEmitter } from "events";
import { URL } from "url";
import { UniquelyIdentified } from "wildboar-microservices-ts";
import { ConfigurationSource } from "../ConfigurationSource";
import { MessageBroker } from "../MessageBroker";
const uuidv4 : () => string = require("uuid/v4");

export default
class AMQPMessageBroker implements MessageBroker, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly protocol : string = "amqp";
    private connection! : Connection;
    private channel! : Channel;
    private responseEmitter : EventEmitter = new EventEmitter();
    public get queueURI () : URL {
        return new URL(
            this.protocol + "://" +
            this.configuration.queue_server_hostname + ":" +
            this.configuration.queue_server_tcp_listening_port.toString()
        );
    }

    constructor (
        readonly configuration : ConfigurationSource
    ) {}

    public async initialize () : Promise<boolean> {
        this.connection = await connect(this.queueURI.toString());
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange("imap.commands", "direct", { durable: true });
        await this.channel.assertExchange("events", "topic", { durable: true });
        await this.channel.assertQueue("events.imap", { durable: false });
        await this.channel.bindQueue("events.imap", "events", "imap");
        await this.channel.assertExchange("authentication", "direct", { durable: true });
        await this.channel.assertQueue("authorization", { durable: false });

        // There only needs to be one authn response queue, because the
        // responses are all roughly the same, despite different SASL
        // mechanisms being used.
        const authenticationResponseQueueName : string = `authentication.responses-${this.id}`;
        // TODO: Make the response queue noAck. I think the @types library is missing that property.
        await this.channel.assertQueue(authenticationResponseQueueName, { exclusive: true });
        await this.channel.consume(authenticationResponseQueueName, (message : ConsumeMessage | null) : void => {
            if (!message) return; // TODO: Do something more informative here.
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
        });
        return Promise.resolve(true);
    }

    public async initializeCommandRPCQueue (commandName : string) : Promise<boolean> {
        // console.log(`initialized for ${this.id}`);
        const responseQueueName : string = `imap.${commandName}.responses-${this.id}`;
        await this.channel.assertQueue(`imap.${commandName}`, { durable: true });
        await this.channel.bindQueue(`imap.${commandName}`, "imap.commands", commandName);
        // TODO: Make the response queue noAck. I think the @types library is missing that property.
        await this.channel.assertQueue(responseQueueName, { exclusive: true });
        await this.channel.consume(responseQueueName, (message : ConsumeMessage | null) : void => {
            if (!message) return; // TODO: Do something more informative here.
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
        });
        return Promise.resolve(true);
    }
    
    // TODO: This code is very similar to publishCommand. Attempt to deduplicate.
    public publishAuthentication (saslMechanism : string, message : object) : Promise<object> {
        const correlationId : string = `urn:uuid:${uuidv4()}`;

        // This induces a timeout, so that we do not accumulate event listeners
        // if the authenticator misses some authentication requests.
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, 10000); // TODO: Change this to a configurable timeout.

        return new Promise<object>((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response : Message | null) : void => {
                if (!response) {
                    console.log(`SASL authentication using mechanism '${saslMechanism}' timed out!`);
                    reject(new Error(`SASL authentication using mechanism '${saslMechanism}' timed out!`));
                    return;
                }
                try {
                    resolve(JSON.parse(response.content.toString()));
                } catch (error) {
                    reject(error);
                }
            });

            (<any>message)["saslMechanism"] = saslMechanism;

            // This MUST occur AFTER this.responseEmitter.once() to prevent a
            // race condition where the storage driver responds before the
            // event listener is established.
            this.channel.publish("authentication", saslMechanism,
            Buffer.from(JSON.stringify(message)), {
                correlationId: correlationId,
                contentType: "application/json",
                contentEncoding: "8bit",
                // expiration: 10000, // TODO: Make this a configurable expiration.
                replyTo: `imap.${saslMechanism}.responses-${this.id}`
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
                contentType: "application/json",
                contentEncoding: "8bit",
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