import ConfigurationSource from "./ConfigurationSource";
import EnvironmentVariablesConfigurationSource from "./ConfigurationSources/EnvironmentVariables";
import { Server } from "./Server";
import * as commands from "./Commands/index";
import MessageBroker from "./MessageBroker";
import { DummyMessageBroker } from "./MessageBrokers/DUMMY";
import { AMQPMessageBroker } from "./MessageBrokers/AMQP";

const configuration : ConfigurationSource =
    new EnvironmentVariablesConfigurationSource();

const plugins = {
    "CAPABILITY": commands.CAPABILITY_COMMAND,
    // "": commands.CHECK_COMMAND,
    // "": commands.CLOSE_COMMAND,
    "CREATE": commands.CREATE_COMMAND,
    // "": commands.DELETE_COMMAND,
    // "": commands.EXAMINE_COMMAND,
    // "": commands.EXPUNGE_COMMAND,
    "LOGIN": commands.LOGIN_COMMAND,
    // "": commands.LOGOUT_COMMAND,
    // "": commands.LIST_COMMAND,
    // "": commands.LSUB_COMMAND,
    // "": commands.NOOP_COMMAND,
    // "": commands.RENAME_COMMAND,
    // "": commands.SELECT_COMMAND,
    // "": commands.STARTTLS_COMMAND,
    // "": commands.SUBSCRIBE_COMMAND,
    // "": commands.UNSUBSCRIBE_COMMAND
};

const messageBroker : MessageBroker = (() : MessageBroker => {
    switch (configuration.queue_protocol.toUpperCase()) {
        case ("DUMMY"): return new DummyMessageBroker(configuration);
        case ("AMQP"): return new AMQPMessageBroker(configuration);
        default: {
            console.log(`Unrecognized queue protocol '${configuration.queue_protocol}'. Using AMQP by default.`);
            return new AMQPMessageBroker(configuration);
        }
    }
})();

const server : Server = new Server(configuration, messageBroker, plugins);