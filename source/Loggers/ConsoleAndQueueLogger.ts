import { Logger } from "../Logger";
import { LogLevel } from "../LogLevel";
import { Messageable } from "../Messageable";
import { MessageBroker } from "../MessageBroker";

// REVIEW: The problem with this is that there is no way of reliably indicating
// which server a message came from.
// Maybe pass the message broker in the constructor?
// And set the server UUID in the messageBroker.
export
class ConsoleAndQueueLogger implements Logger {

    private static DEBUG_ICON : string = "(?)";
    private static INFO_ICON : string = "(i)";
    private static WARN_ICON : string = "<!>";
    private static ERROR_ICON : string = "[X]";
    public consoleLogLevel : LogLevel = LogLevel.INFO;
    public queueLogLevel : LogLevel = LogLevel.INFO;

    constructor (
        readonly messageBroker : MessageBroker
    ) {}
    
    public initialize () : Promise<boolean> {
        return Promise.resolve(true);
    }

    public async close () : Promise<boolean> {
        return Promise.resolve(true);
    }

    public debug (event : Messageable) : void {
        if (console && (this.consoleLogLevel <= LogLevel.DEBUG))
            console.debug(`${ConsoleAndQueueLogger.DEBUG_ICON} ${event.message}`);
        if (this.queueLogLevel <= LogLevel.DEBUG) {
            (<any>event)["severity"] = "DEBUG";
            if (event.topic) this.messageBroker.publishEvent(event.topic, event);
            else this.messageBroker.publishEvent("imap", event);
        }
    }

    public info (event : Messageable) : void {
        if (console && (this.consoleLogLevel <= LogLevel.INFO))
            console.info(`${ConsoleAndQueueLogger.INFO_ICON} ${event.message}`);
        if (this.queueLogLevel <= LogLevel.INFO) {
            (<any>event)["severity"] = "INFO";
            if (event.topic) this.messageBroker.publishEvent(event.topic, event);
            else this.messageBroker.publishEvent("imap", event);
        }
    }

    public warn (event : Messageable) : void {
        if (console && (this.consoleLogLevel <= LogLevel.WARN))
            console.warn(`${ConsoleAndQueueLogger.WARN_ICON} ${event.message}`);
        if (this.queueLogLevel <= LogLevel.WARN) {
            (<any>event)["severity"] = "WARN";
            if (event.topic) this.messageBroker.publishEvent(event.topic, event);
            else this.messageBroker.publishEvent("imap", event);
        }
    }

    public error (event : Messageable) : void {
        if (console && (this.consoleLogLevel <= LogLevel.ERROR))
            console.error(`${ConsoleAndQueueLogger.ERROR_ICON} ${event.message}`);
        if (this.queueLogLevel <= LogLevel.ERROR) {
            (<any>event)["severity"] = "ERROR";
            this.messageBroker.publishEvent("imap.error", event);
        }
    }
}