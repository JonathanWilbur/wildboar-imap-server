"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Commands_1 = require("../Commands");
const amqp = require("amqplib/callback_api");
const uuidv4 = require("uuid/v4");
class AMQPMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.responseEmitter = new events_1.EventEmitter();
        this.server_host = configuration.queue_server_hostname;
        this.server_port = configuration.queue_server_tcp_listening_port;
        amqp.connect(`amqp://${this.server_host}:${this.server_port}`, (err, connection) => {
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
                Commands_1.IMAP_STORAGE_COMMANDS.forEach((command) => {
                    const responseQueueName = `imap.${command}.responses-${this.id}`;
                    channel.assertQueue(`imap.${command}`, { durable: true });
                    channel.bindQueue(`imap.${command}`, "imap.commands", command);
                    channel.assertQueue(responseQueueName, { exclusive: true });
                    channel.consume(responseQueueName, (message) => {
                        if (!message)
                            return;
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
    publishCommand(command, message) {
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
    select(user, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("SELECT", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    examine(user, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("EXAMINE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    create(user, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("CREATE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    delete(user, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("DELETE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    rename(user, existingMailboxName, newMailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("RENAME", {
                user: user,
                arguments: {
                    existingMailboxName: existingMailboxName,
                    newMailboxName: newMailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    subscribe(user, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("SUBSCRIBE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    unsubscribe(user, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("UNSUBSCRIBE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    list(user, referenceName, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("LIST", {
                user: user,
                arguments: {
                    referenceName: referenceName,
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    lsub(user, referenceName, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("LSUB", {
                user: user,
                arguments: {
                    referenceName: referenceName,
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    status(user, mailboxName, statusDataItemNames) {
        return new Promise((resolve, reject) => {
            this.publishCommand("STATUS", {
                user: user,
                arguments: {
                    mailboxName: mailboxName,
                    statusDataItemNames: statusDataItemNames
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    append(user, mailboxName, message, flags = [], dateTime) {
        return new Promise((resolve, reject) => {
            this.publishCommand("APPEND", {
                user: user,
                arguments: {
                    mailboxName: mailboxName,
                    message: message,
                    flags: flags,
                    dateTime: dateTime || (new Date())
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    check(user) {
        return new Promise((resolve, reject) => {
            this.publishCommand("CHECK", {
                user: user,
                arguments: {}
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    close(user) {
        return new Promise((resolve, reject) => {
            this.publishCommand("CLOSE", {
                user: user,
                arguments: {}
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    expunge(user) {
        return new Promise((resolve, reject) => {
            this.publishCommand("EXPUNGE", {
                user: user,
                arguments: {}
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    search(user, searchCriteria, charset = "US-ASCII") {
        return new Promise((resolve, reject) => {
            this.publishCommand("SEARCH", {
                user: user,
                arguments: {
                    searchCriteria: searchCriteria,
                    charset: charset
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    fetch(user, sequenceSet, dataItemNames) {
        return new Promise((resolve, reject) => {
            this.publishCommand("FETCH", {
                user: user,
                arguments: {
                    sequenceSet: sequenceSet,
                    dataItemNames: dataItemNames
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    store(user, sequenceSet, flags, silent, add) {
        return new Promise((resolve, reject) => {
            this.publishCommand("STORE", {
                user: user,
                arguments: {
                    sequenceSet: sequenceSet,
                    flags: flags,
                    silent: silent,
                    add: add
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    copy(user, sequenceSet, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("COPY", {
                user: user,
                arguments: {
                    sequenceSet: sequenceSet,
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    uidCopy(user, sequenceSet, mailboxName) {
        return new Promise((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "COPY",
                arguments: {
                    sequenceSet: sequenceSet,
                    mailboxName: mailboxName
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    uidFetch(user, sequenceSet, dataItemNames) {
        return new Promise((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "FETCH",
                arguments: {
                    sequenceSet: sequenceSet,
                    dataItemNames: dataItemNames
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    uidStore(user, sequenceSet, flags, silent, add) {
        return new Promise((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "STORE",
                arguments: {
                    sequenceSet: sequenceSet,
                    flags: flags,
                    silent: silent,
                    add: add
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
        });
    }
    uidSearch(user, searchCriteria, charset = "US-ASCII") {
        return new Promise((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "SEARCH",
                arguments: {
                    searchCriteria: searchCriteria,
                    charset: charset
                }
            })
                .then((response) => {
                resolve(response);
            })
                .catch(reject);
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
