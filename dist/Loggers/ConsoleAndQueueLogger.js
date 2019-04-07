"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LogLevel_1 = require("../LogLevel");
class ConsoleAndQueueLogger {
    constructor(messageBroker) {
        this.messageBroker = messageBroker;
        this.consoleLogLevel = LogLevel_1.LogLevel.INFO;
        this.queueLogLevel = LogLevel_1.LogLevel.INFO;
    }
    initialize() {
        return Promise.resolve(true);
    }
    async close() {
        return Promise.resolve(true);
    }
    debug(event) {
        if (console && (this.consoleLogLevel >= LogLevel_1.LogLevel.DEBUG))
            console.debug(`${ConsoleAndQueueLogger.DEBUG_ICON} ${event.message}`);
        if (this.queueLogLevel >= LogLevel_1.LogLevel.DEBUG) {
            event["severity"] = "DEBUG";
            if (event.topic)
                this.messageBroker.publishEvent(event.topic, event);
            else
                this.messageBroker.publishEvent("imap", event);
        }
    }
    info(event) {
        if (console && (this.consoleLogLevel >= LogLevel_1.LogLevel.INFO))
            console.info(`${ConsoleAndQueueLogger.INFO_ICON} ${event.message}`);
        if (this.queueLogLevel >= LogLevel_1.LogLevel.INFO) {
            event["severity"] = "INFO";
            if (event.topic)
                this.messageBroker.publishEvent(event.topic, event);
            else
                this.messageBroker.publishEvent("imap", event);
        }
    }
    warn(event) {
        if (console && (this.consoleLogLevel >= LogLevel_1.LogLevel.WARN))
            console.warn(`${ConsoleAndQueueLogger.WARN_ICON} ${event.message}`);
        if (this.queueLogLevel >= LogLevel_1.LogLevel.WARN) {
            event["severity"] = "WARN";
            if (event.topic)
                this.messageBroker.publishEvent(event.topic, event);
            else
                this.messageBroker.publishEvent("imap", event);
        }
    }
    error(event) {
        if (console && (this.consoleLogLevel >= LogLevel_1.LogLevel.ERROR))
            console.error(`${ConsoleAndQueueLogger.ERROR_ICON} ${event.message}`);
        if (this.queueLogLevel >= LogLevel_1.LogLevel.ERROR) {
            event["severity"] = "ERROR";
            this.messageBroker.publishEvent("imap.error", event);
        }
    }
}
ConsoleAndQueueLogger.DEBUG_ICON = "(?)";
ConsoleAndQueueLogger.INFO_ICON = "(i)";
ConsoleAndQueueLogger.WARN_ICON = "<!>";
ConsoleAndQueueLogger.ERROR_ICON = "[X]";
exports.ConsoleAndQueueLogger = ConsoleAndQueueLogger;
//# sourceMappingURL=ConsoleAndQueueLogger.js.map