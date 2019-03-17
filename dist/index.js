"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Server_1 = require("./Server");
const server = new Server_1.default(new EnvironmentVariables_1.default());
