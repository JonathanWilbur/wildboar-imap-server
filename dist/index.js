"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Server_1 = require("./Server");
const commands = require("./Commands/index");
const DUMMY_1 = require("./MessageBrokers/DUMMY");
const AMQP_1 = require("./MessageBrokers/AMQP");
const configuration = new EnvironmentVariables_1.default();
const plugins = {
    "CAPABILITY": commands.CAPABILITY_COMMAND,
    "CREATE": commands.CREATE_COMMAND,
    "LOGIN": commands.LOGIN_COMMAND,
};
const messageBroker = (() => {
    switch (configuration.queue_protocol.toUpperCase()) {
        case ("DUMMY"): return new DUMMY_1.DummyMessageBroker(configuration);
        case ("AMQP"): return new AMQP_1.AMQPMessageBroker(configuration);
        default: {
            console.log(`Unrecognized queue protocol '${configuration.queue_protocol}'. Using AMQP by default.`);
            return new AMQP_1.AMQPMessageBroker(configuration);
        }
    }
})();
const server = new Server_1.Server(configuration, messageBroker, plugins);
