"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Server_1 = require("./Server");
const index_1 = require("./Commands/index");
const server = new Server_1.default(new EnvironmentVariables_1.default(), [
    index_1.CAPABILITY_COMMAND,
    index_1.CREATE_COMMAND,
    index_1.LOGIN_COMMAND,
    index_1.LIST_COMMAND,
    index_1.LSUB_COMMAND
]);
