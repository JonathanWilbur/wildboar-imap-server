"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandPlugin {
    constructor(argumentsScanner, callback) {
        this.argumentsScanner = argumentsScanner;
        this.callback = callback;
        this.contributesCapabilities = [];
        this.acceptableConnectionState = null;
    }
    mayExecuteWhileInConnectionState(state) {
        return ((this.acceptableConnectionState === null) || (state === this.acceptableConnectionState));
    }
}
exports.CommandPlugin = CommandPlugin;
//# sourceMappingURL=CommandPlugin.js.map