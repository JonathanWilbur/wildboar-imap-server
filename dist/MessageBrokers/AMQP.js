"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = require("amqplib");
const events_1 = require("events");
const url_1 = require("url");
const uuid_1 = require("uuid");
class AMQPMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuid_1.v4()}`;
        this.creationTime = new Date();
        this.protocol = "amqp";
        this.responseEmitter = new events_1.EventEmitter();
    }
    get queueURI() {
        return new url_1.URL(this.protocol + "://" +
            this.configuration.queue_server_hostname + ":" +
            this.configuration.queue_server_tcp_listening_port.toString());
    }
    async initialize() {
        this.connection = await amqplib_1.connect(this.queueURI.toString());
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange("imap.commands", "direct", { durable: true });
        await this.channel.assertExchange("events", "topic", { durable: true });
        await this.channel.assertQueue("events.imap", { durable: false });
        await this.channel.bindQueue("events.imap", "events", "imap");
        await this.channel.assertExchange("authentication", "direct", { durable: true });
        await this.channel.assertQueue("authorization.imap", { durable: false });
        await this.channel.assertExchange("authorization", "direct", { durable: true });
        await this.channel.bindQueue("authorization.imap", "authorization", "imap");
        const authenticationResponseQueueName = `authentication.responses-${this.id}`;
        await this.channel.assertQueue(authenticationResponseQueueName, { exclusive: true });
        await this.channel.consume(authenticationResponseQueueName, (message) => {
            if (!message)
                return;
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, { noAck: true });
        const authorizationResponseQueueName = `authorization.responses-${this.id}`;
        await this.channel.assertQueue(authorizationResponseQueueName, { exclusive: true });
        await this.channel.consume(authorizationResponseQueueName, (message) => {
            if (!message)
                return;
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, { noAck: true });
        return Promise.resolve(true);
    }
    async initializeCommandRPCQueue(commandName) {
        const responseQueueName = `imap.${commandName}.responses-${this.id}`;
        await this.channel.assertQueue(`imap.${commandName}`, { durable: true });
        await this.channel.bindQueue(`imap.${commandName}`, "imap.commands", commandName);
        await this.channel.assertQueue(responseQueueName, { exclusive: true });
        await this.channel.consume(responseQueueName, (message) => {
            if (!message)
                return;
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
        });
        return Promise.resolve(true);
    }
    publishAuthentication(saslMechanism, message) {
        const correlationId = `urn:uuid:${uuid_1.v4()}`;
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, this.configuration.queue_rpc_message_timeout_in_milliseconds);
        return new Promise((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response) => {
                if (!response) {
                    reject(new Error(`SASL authentication using mechanism '${saslMechanism}' timed out!`));
                    return;
                }
                try {
                    resolve(JSON.parse(response.content.toString()));
                }
                catch (error) {
                    reject(error);
                }
            });
            message["saslMechanism"] = saslMechanism;
            this.channel.publish("authentication", saslMechanism, Buffer.from(JSON.stringify(message)), {
                correlationId: correlationId,
                contentType: "application/json",
                contentEncoding: "8bit",
                expiration: this.configuration.queue_rpc_message_timeout_in_milliseconds,
                replyTo: `authentication.responses-${this.id}`
            });
        });
    }
    publishAuthorization(connection, message) {
        const correlationId = `urn:uuid:${uuid_1.v4()}`;
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, this.configuration.queue_rpc_message_timeout_in_milliseconds);
        return new Promise((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response) => {
                if (!response) {
                    reject(new Error(`Authorization request timed out!`));
                    return;
                }
                try {
                    resolve(JSON.parse(response.content.toString()));
                }
                catch (error) {
                    reject(error);
                }
            });
            message.protocol = "imap";
            message.protocolVersion = 4;
            message.server = {
                id: connection.server.id,
                creationTime: connection.server.creationTime
            };
            message.messageBroker = {
                id: this.id,
                creationTime: this.creationTime
            };
            message.connection = {
                id: connection.id,
                creationTime: connection.creationTime,
                currentlySelectedMailbox: connection.currentlySelectedMailbox,
                authenticatedUser: connection.authenticatedUser,
                connectionState: connection.state,
                socket: connection.socketReport
            };
            this.channel.publish("authorization", "imap", Buffer.from(JSON.stringify(message)), {
                correlationId: correlationId,
                contentType: "application/json",
                contentEncoding: "8bit",
                expiration: this.configuration.queue_rpc_message_timeout_in_milliseconds,
                replyTo: `authorization.responses-${this.id}`
            });
        });
    }
    publishCommand(authenticatedUser, command, message) {
        const correlationId = `urn:uuid:${uuid_1.v4()}`;
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, this.configuration.queue_rpc_message_timeout_in_milliseconds);
        return new Promise((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response) => {
                if (!response) {
                    reject(new Error(`IMAP Command '${command}' timed out!`));
                    return;
                }
                try {
                    resolve(JSON.parse(response.content.toString()));
                }
                catch (error) {
                    reject(error);
                }
            });
            message["command"] = command;
            message["authenticatedUser"] = authenticatedUser;
            this.channel.publish("imap.commands", command, Buffer.from(JSON.stringify(message)), {
                correlationId: correlationId,
                contentType: "application/json",
                contentEncoding: "8bit",
                expiration: this.configuration.queue_rpc_message_timeout_in_milliseconds,
                replyTo: `imap.${command}.responses-${this.id}`
            });
        });
    }
    publishEvent(topic, message) {
        this.channel.publish("events", topic, Buffer.from(JSON.stringify(message)));
    }
    async closeConnection() {
        await this.channel.close();
        await this.connection.close();
        return Promise.resolve(true);
    }
}
exports.default = AMQPMessageBroker;
//# sourceMappingURL=AMQP.js.map