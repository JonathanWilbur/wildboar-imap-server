import { AuthenticationRequest } from "../AuthenticationRequest";
import { connect, Channel, Connection, ConsumeMessage, Message } from "amqplib";
import { EventEmitter } from "events";
import { URL } from "url";
import { UniquelyIdentified } from "wildboar-microservices-ts";
import { ConfigurationSource } from "../ConfigurationSource";
import { MessageBroker } from "../MessageBroker";
import { v4 as uuidv4 } from "uuid";

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
            // From the AMQPlib documentation:
            // "If the consumer is cancelled by RabbitMQ, the message callback will be invoked with null."
            // (http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume)
            if (!message) return;
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
        });
        return Promise.resolve(true);
    }

    public async initializeCommandRPCQueue (commandName : string) : Promise<boolean> {
        const responseQueueName : string = `imap.${commandName}.responses-${this.id}`;
        await this.channel.assertQueue(`imap.${commandName}`, { durable: true });
        await this.channel.bindQueue(`imap.${commandName}`, "imap.commands", commandName);
        // TODO: Make the response queue noAck. I think the @types library is missing that property.
        await this.channel.assertQueue(responseQueueName, { exclusive: true });
        await this.channel.consume(responseQueueName, (message : ConsumeMessage | null) : void => {
            // From the AMQPlib documentation:
            // "If the consumer is cancelled by RabbitMQ, the message callback will be invoked with null."
            // (http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume)
            if (!message) return;
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
        });
        return Promise.resolve(true);
    }
    
    public publishAuthentication (saslMechanism : string, message : AuthenticationRequest) : Promise<object> {
        const correlationId : string = `urn:uuid:${uuidv4()}`;

        // This induces a timeout, so that we do not accumulate event listeners
        // if the authenticator misses some authentication requests.
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, this.configuration.queue_rpc_message_timeout_in_milliseconds);

        return new Promise<object>((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response : Message | null) : void => {
                if (!response) {
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
                expiration: this.configuration.queue_rpc_message_timeout_in_milliseconds,
                replyTo: `authentication.responses-${this.id}`
            });
        });
    }

    public publishCommand (authenticatedUser : string, command : string, message : object) : Promise<object> {
        const correlationId : string = `urn:uuid:${uuidv4()}`;

        // This induces a timeout, so that we do not accumulate event listeners
        // if the authenticator misses some authentication requests.
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, this.configuration.queue_rpc_message_timeout_in_milliseconds);

        return new Promise<object>((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response : Message | null) : void => {
                if (!response) {
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
                expiration: this.configuration.queue_rpc_message_timeout_in_milliseconds,
                replyTo: `imap.${command}.responses-${this.id}`
            });
        });
    }

    public publishEvent (topic : string, message : object) : void {
        this.channel.publish("events", topic, Buffer.from(JSON.stringify(message)));
    }

    public async closeConnection () : Promise<boolean> {
        await this.channel.close();
        await this.connection.close();
        return Promise.resolve(true);
    }

}