"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Server_1 = require("./Server");
const index_1 = require("./Commands/index");
const server = new Server_1.Server(new EnvironmentVariables_1.default(), [
    index_1.CAPABILITY_COMMAND,
    index_1.CHECK_COMMAND,
    index_1.CLOSE_COMMAND,
    index_1.CREATE_COMMAND,
    index_1.DELETE_COMMAND,
    index_1.EXAMINE_COMMAND,
    index_1.EXPUNGE_COMMAND,
    index_1.LOGIN_COMMAND,
    index_1.LOGOUT_COMMAND,
    index_1.LIST_COMMAND,
    index_1.LSUB_COMMAND,
    index_1.NOOP_COMMAND,
    index_1.RENAME_COMMAND,
    index_1.SELECT_COMMAND,
    index_1.STARTTLS_COMMAND,
    index_1.SUBSCRIBE_COMMAND,
    index_1.UNSUBSCRIBE_COMMAND
]);
