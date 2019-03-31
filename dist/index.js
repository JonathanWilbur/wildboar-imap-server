"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Server_1 = require("./Server");
const commands = require("./Commands/index");
const server = new Server_1.Server(new EnvironmentVariables_1.default(), {
    "CAPABILITY": commands.CAPABILITY_COMMAND,
    "CREATE": commands.CREATE_COMMAND,
    "LOGIN": commands.LOGIN_COMMAND,
});
