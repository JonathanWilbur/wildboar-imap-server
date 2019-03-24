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
class AMQPMessageBroker implements MessageBroker,UniquelyIdentified {

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

    private publishCommand (command : string, message : object) : Promise<object> {
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

    // TODO: Find a way to get more information into the command.
    public select (user : string, mailboxName : string) : Promise<SelectResponse> {
        return new Promise<SelectResponse>((resolve, reject) => {
            this.publishCommand("SELECT", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<SelectResponse>response);
            })
            .catch(reject);
        });
    }

    public examine (user : string, mailboxName : string) : Promise<ExamineResponse> {
        return new Promise<ExamineResponse>((resolve, reject) => {
            this.publishCommand("EXAMINE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<ExamineResponse>response);
            })
            .catch(reject);
        });
    }

    public create (user : string, mailboxName : string) : Promise<CreateResponse> {
        return new Promise<CreateResponse>((resolve, reject) => {
            this.publishCommand("CREATE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<CreateResponse>response);
            })
            .catch(reject);
        });
    }

    public delete (user : string, mailboxName : string) : Promise<DeleteResponse> {
        return new Promise<DeleteResponse>((resolve, reject) => {
            this.publishCommand("DELETE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<DeleteResponse>response);
            })
            .catch(reject);
        });
    }

    public rename (user : string, existingMailboxName : string, newMailboxName : string) : Promise<RenameResponse> {
        return new Promise<RenameResponse>((resolve, reject) => {
            this.publishCommand("RENAME", {
                user: user,
                arguments: {
                    existingMailboxName: existingMailboxName,
                    newMailboxName: newMailboxName
                }
            })
            .then((response : object) => {
                resolve(<RenameResponse>response);
            })
            .catch(reject);
        });
    }

    public subscribe (user : string, mailboxName : string) : Promise<SubscribeResponse> {
        return new Promise<SubscribeResponse>((resolve, reject) => {
            this.publishCommand("SUBSCRIBE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<SubscribeResponse>response);
            })
            .catch(reject);
        });
    }

    public unsubscribe (user : string, mailboxName : string) : Promise<UnsubscribeResponse> {
        return new Promise<UnsubscribeResponse>((resolve, reject) => {
            this.publishCommand("UNSUBSCRIBE", {
                user: user,
                arguments: {
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<UnsubscribeResponse>response);
            })
            .catch(reject);
        });
    }

    public list (user : string, referenceName : string, mailboxName : string) : Promise<ListResponse> {
        return new Promise<ListResponse>((resolve, reject) => {
            this.publishCommand("LIST", {
                user: user,
                arguments: {
                    referenceName: referenceName,
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<ListResponse>response);
            })
            .catch(reject);
        });
    }

    public lsub (user : string, referenceName : string, mailboxName : string) : Promise<LsubResponse> {
        return new Promise<LsubResponse>((resolve, reject) => {
            this.publishCommand("LSUB", {
                user: user,
                arguments: {
                    referenceName: referenceName,
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<LsubResponse>response);
            })
            .catch(reject);
        });
    }

    public status (user : string, mailboxName : string, statusDataItemNames : string[]) : Promise<StatusResponse> {
        return new Promise<StatusResponse>((resolve, reject) => {
            this.publishCommand("STATUS", {
                user: user,
                arguments: {
                    mailboxName: mailboxName,
                    statusDataItemNames: statusDataItemNames
                }
            })
            .then((response : object) => {
                resolve(<StatusResponse>response);
            })
            .catch(reject);
        });
    }

    public append (user : string, mailboxName : string, message : Buffer, flags : string[] = [], dateTime? : Date) : Promise<AppendResponse> {
        return new Promise<AppendResponse>((resolve, reject) => {
            this.publishCommand("APPEND", {
                user: user,
                arguments: {
                    mailboxName : mailboxName,
                    message : message,
                    flags: flags,
                    dateTime: dateTime || (new Date())
                }
            })
            .then((response : object) => {
                resolve(<AppendResponse>response);
            })
            .catch(reject);
        });
    }

    public check (user : string) : Promise<CheckResponse> {
        return new Promise<CheckResponse>((resolve, reject) => {
            this.publishCommand("CHECK", {
                user: user,
                arguments: {}
            })
            .then((response : object) => {
                resolve(<CheckResponse>response);
            })
            .catch(reject);
        });
    }

    public close (user : string) : Promise<CloseResponse> {
        return new Promise<CloseResponse>((resolve, reject) => {
            this.publishCommand("CLOSE", {
                user: user,
                arguments: {}
            })
            .then((response : object) => {
                resolve(<CloseResponse>response);
            })
            .catch(reject);
        });
    }

    public expunge (user : string) : Promise<ExpungeResponse> {
        return new Promise<ExpungeResponse>((resolve, reject) => {
            this.publishCommand("EXPUNGE", {
                user: user,
                arguments: {}
            })
            .then((response : object) => {
                resolve(<ExpungeResponse>response);
            })
            .catch(reject);
        });
    }

    // Search critera are a list of flags or key-value pairs, such as "TO jonathan@wilbur.space"
    public search (user : string, searchCriteria : string[], charset : string = "US-ASCII") : Promise<SearchResponse> {
        // TODO: Validate searchCriteria
        return new Promise<SearchResponse>((resolve, reject) => {
            this.publishCommand("SEARCH", {
                user: user,
                arguments: {
                    searchCriteria: searchCriteria,
                    charset: charset
                }
            })
            .then((response : object) => {
                resolve(<SearchResponse>response);
            })
            .catch(reject);
        });
    }

    public fetch (user : string, sequenceSet : SequenceSet, dataItemNames : string[]) : Promise<FetchResponse> {
        return new Promise<FetchResponse>((resolve, reject) => {
            this.publishCommand("FETCH", {
                user: user,
                arguments: {
                    sequenceSet: sequenceSet,
                    dataItemNames: dataItemNames
                }
            })
            .then((response : object) => {
                resolve(<FetchResponse>response);
            })
            .catch(reject);
        });
    }

    public store (user : string, sequenceSet : SequenceSet, flags : string[], silent : boolean, add? : boolean) : Promise<StoreResponse> {
        return new Promise<StoreResponse>((resolve, reject) => {
            this.publishCommand("STORE", {
                user: user,
                arguments: {
                    sequenceSet: sequenceSet,
                    flags: flags,
                    silent: silent,
                    add: add
                }
            })
            .then((response : object) => {
                resolve(<StoreResponse>response);
            })
            .catch(reject);
        });
    }

    // sequence-set has a much more complicated syntax than simply two numbers.
    public copy (user : string, sequenceSet : SequenceSet, mailboxName : string) : Promise<CopyResponse> {
        return new Promise<CopyResponse>((resolve, reject) => {
            this.publishCommand("COPY", {
                user: user,
                arguments: {
                    sequenceSet: sequenceSet,
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<CopyResponse>response);
            })
            .catch(reject);
        });
    }

    public uidCopy (user : string, sequenceSet : SequenceSet, mailboxName : string) : Promise<CopyResponse> {
        return new Promise<CopyResponse>((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "COPY",
                arguments: {
                    sequenceSet: sequenceSet,
                    mailboxName: mailboxName
                }
            })
            .then((response : object) => {
                resolve(<CopyResponse>response);
            })
            .catch(reject);
        });
    }

    public uidFetch (user : string, sequenceSet : SequenceSet, dataItemNames : string[]) : Promise<FetchResponse> {
        return new Promise<FetchResponse>((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "FETCH",
                arguments: {
                    sequenceSet: sequenceSet,
                    dataItemNames: dataItemNames
                }
            })
            .then((response : object) => {
                resolve(<FetchResponse>response);
            })
            .catch(reject);
        });
    }

    public uidStore (user : string, sequenceSet : SequenceSet, flags : string[], silent : boolean, add? : boolean) : Promise<StoreResponse> {
        return new Promise<StoreResponse>((resolve, reject) => {
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
            .then((response : object) => {
                resolve(<StoreResponse>response);
            })
            .catch(reject);
        });
    }

    public uidSearch (user : string, searchCriteria : string[], charset : string = "US-ASCII") : Promise<SearchResponse> {
        return new Promise<SearchResponse>((resolve, reject) => {
            this.publishCommand("UID", {
                user: user,
                subcommand: "SEARCH",
                arguments: {
                    searchCriteria: searchCriteria,
                    charset: charset
                }
            })
            .then((response : object) => {
                resolve(<SearchResponse>response);
            })
            .catch(reject);
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