"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandPlugin {
    constructor(commandName, callback) {
        this.commandName = commandName;
        this.callback = callback;
    }
}
exports.CommandPlugin = CommandPlugin;
