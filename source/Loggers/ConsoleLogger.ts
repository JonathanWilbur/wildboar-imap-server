import { Logger } from "../Logger";
import { Messageable } from "../Messageable";

// REVIEW: The problem with this is that there is no way of reliably indicating
// which server a message came from.
// Maybe pass the message broker in the constructor?
// And set the server UUID in the messageBroker.
export
class ConsoleLogger implements Logger {
    private static DEBUG_ICON : string = "(?)";
    private static INFO_ICON : string = "(i)";
    private static WARN_ICON : string = "<!>";
    private static ERROR_ICON : string = "[X]";
    public initialize () : Promise<boolean> {
        return Promise.resolve(true);
    }
    public close () : Promise<boolean> {
        return Promise.resolve(true);
    }
    public debug (event : Messageable) : void {
        if (console) console.debug(`${ConsoleLogger.DEBUG_ICON} ${event.message}`);
    }
    public info (event : Messageable) : void {
        if (console) console.info(`${ConsoleLogger.INFO_ICON} ${event.message}`);
    }
    public warn (event : Messageable) : void {
        if (console) console.warn(`${ConsoleLogger.WARN_ICON} ${event.message}`);
    }
    public error (event : Messageable) : void {
        if (console) console.error(`${ConsoleLogger.ERROR_ICON} ${event.message}`)
    }
}