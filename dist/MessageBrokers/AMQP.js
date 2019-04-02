"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const url_1 = require("url");
const amqp = require("amqplib/callback_api");
const uuidv4 = require("uuid/v4");
class AMQPMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.protocol = "amqp";
        this.responseEmitter = new events_1.EventEmitter();
        amqp.connect(this.queueURI.toString(), (err, connection) => {
            if (err) {
                console.log(err);
                return;
            }
            this.connection = connection;
            connection.createChannel((err, channel) => {
                if (err) {
                    console.log(err);
                    return;
                }
                this.channel = channel;
                channel.assertExchange("imap.commands", "direct", { durable: true });
                channel.assertExchange("events", "topic", { durable: true });
                channel.assertQueue("events.imap", { durable: false });
                channel.bindQueue("events.imap", "events", "imap");
                channel.assertExchange("authentication", "direct", { durable: true });
                channel.assertQueue("authentication.responses", { durable: false });
                channel.bindQueue("authentication.responses", "authentication", "authentication.responses");
                channel.assertQueue("PLAIN", { durable: false });
                channel.bindQueue("PLAIN", "authentication", "authentication.PLAIN");
                channel.assertQueue("EXTERNAL", { durable: false });
                channel.bindQueue("EXTERNAL", "authentication", "authentication.EXTERNAL");
                channel.assertQueue("ANONYMOUS", { durable: false });
                channel.bindQueue("ANONYMOUS", "authentication", "authentication.ANONYMOUS");
                channel.assertQueue("authorization", { durable: false });
            });
        });
    }
    get queueURI() {
        return new url_1.URL(this.protocol + "://" +
            this.configuration.queue_server_hostname + ":" +
            this.configuration.queue_server_tcp_listening_port.toString());
    }
    initializeCommandRPCQueue(commandName) {
        const responseQueueName = `imap.${commandName}.responses-${this.id}`;
        this.channel.assertQueue(`imap.${commandName}`, { durable: true });
        this.channel.bindQueue(`imap.${commandName}`, "imap.commands", commandName);
        this.channel.assertQueue(responseQueueName, { exclusive: true });
        this.channel.consume(responseQueueName, (message) => {
            if (!message)
                return;
            this.responseEmitter.emit(message.properties.correlationId, message);
        }, {
            noAck: true
        });
    }
    publishCommand(authenticatedUser, command, message) {
        const correlationId = `urn:uuid:${uuidv4()}`;
        setTimeout(() => {
            this.responseEmitter.emit(correlationId, null);
        }, 10000);
        return new Promise((resolve, reject) => {
            this.responseEmitter.once(correlationId, (response) => {
                if (!response) {
                    console.log(`IMAP Command '${command}' timed out!`);
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
            this.channel.publish("imap.commands", command, Buffer.from(JSON.stringify(message)), {
                correlationId: correlationId,
                content_type: "application/json",
                content_encoding: "8bit",
                replyTo: `imap.${command}.responses-${this.id}`
            });
        });
    }
    publishEvent(topic, message) {
        this.channel.publish("events", topic, Buffer.from(JSON.stringify(message)));
    }
    closeConnection() {
        this.channel.close();
        this.connection.close();
    }
}
exports.default = AMQPMessageBroker;
//# sourceMappingURL=AMQP.js.map