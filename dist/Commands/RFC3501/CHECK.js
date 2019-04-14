"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandPlugin_1 = require("../../CommandPlugin");
const NewLineLexer_1 = require("../../ArgumentLexers/NewLineLexer");
const ConnectionState_1 = require("../../ConnectionState");
const SimpleSelectedMailbox_1 = require("../../CommandHandlers/SimpleSelectedMailbox");
const plugin = new CommandPlugin_1.CommandPlugin(NewLineLexer_1.lexer, SimpleSelectedMailbox_1.handler);
plugin.acceptableConnectionState = ConnectionState_1.ConnectionState.SELECTED;
exports.default = plugin;
//# sourceMappingURL=CHECK.js.map