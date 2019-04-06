"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleLogger {
    initialize() {
        return Promise.resolve(true);
    }
    debug(event) {
        if (console)
            console.debug(`${ConsoleLogger.DEBUG_ICON} ${event.message}`);
    }
    info(event) {
        if (console)
            console.info(`${ConsoleLogger.INFO_ICON} ${event.message}`);
    }
    warn(event) {
        if (console)
            console.warn(`${ConsoleLogger.WARN_ICON} ${event.message}`);
    }
    error(event) {
        if (console)
            console.error(`${ConsoleLogger.ERROR_ICON} ${event.message}`);
    }
}
ConsoleLogger.DEBUG_ICON = "(?)";
ConsoleLogger.INFO_ICON = "(i)";
ConsoleLogger.WARN_ICON = "<!>";
ConsoleLogger.ERROR_ICON = "[X]";
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=ConsoleLogger.js.map