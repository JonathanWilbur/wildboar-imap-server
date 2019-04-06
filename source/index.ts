import * as fs from "fs";
import * as path from "path";
import { CommandPlugin } from "./CommandPlugin";
import { ConfigurationSource } from "./ConfigurationSource";
import { ConsoleAndQueueLogger } from "./Loggers/ConsoleAndQueueLogger";
import { EnvironmentVariablesConfigurationSource } from "./ConfigurationSources/EnvironmentVariables";
import { Logger } from "./Logger";
import { MessageBroker } from "./MessageBroker";
import { Server } from "./Server";

function *pluginIterator (directoryName : string) : IterableIterator<string> {
    const entries : string[] = fs.readdirSync(directoryName, { encoding: "utf8" });
    for (let i : number = 0; i < entries.length; i++) {
        const fullEntryPath : string = path.join(directoryName, entries[i]);
        if (fs.statSync(fullEntryPath).isDirectory()) {
            const subdirectory = pluginIterator(fullEntryPath);
            let iteration = subdirectory.next();
            while (!iteration.done) {
                yield iteration.value;
                iteration = subdirectory.next();
            }
        } else if (fullEntryPath.endsWith(".js")) { // TODO: Make sure its a file!
            yield fullEntryPath;
        }
    }
}

(async () => {
    const configuration : ConfigurationSource =
        new EnvironmentVariablesConfigurationSource();
    await configuration.initialize();

    // Loading the message broker plugins
    const messageBrokersDirectory : string = path.join(__dirname, "MessageBrokers");
    const messageBrokerProtocols : { [ protocolName : string ] : string } = {};
    const messageBrokerPluginsIterator = pluginIterator(messageBrokersDirectory);
    for (let plugin of messageBrokerPluginsIterator) {
        const protocolName : string = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
        messageBrokerProtocols[protocolName] = plugin;
        if (console)
            console.log(`Found (but not yet loaded) message broker plugin for protocol '${protocolName}'.`);
    }

    // Initializing the chosen message broker plugin
    const queueProtocol : string = configuration.queue_protocol.toUpperCase();
    if (!(queueProtocol in messageBrokerProtocols)) {
        if (console) console.error(`No message broker plugin is available for the protocol '${queueProtocol}'.`);
        if (console) console.error(`Your choices are: ${Object.keys(messageBrokerProtocols).join(", ")}.`);
        process.exit(1);
    }
    const messageBroker : MessageBroker = 
        new (require(messageBrokerProtocols[queueProtocol]).default)(configuration);
    await messageBroker.initialize();
    if (console) console.log(`Loaded message broker plugin for protocol '${queueProtocol}'.`);

    // Loading the command plugins
    const commandsDirectory : string = path.join(__dirname, "Commands");
    const plugins : { [ commandName : string ] : CommandPlugin } = {};
    const commandPluginsIterator = pluginIterator(commandsDirectory);
    for (let plugin of commandPluginsIterator) {
        const commandName : string = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
        // TODO: Check that every character is valid for a command.
        plugins[commandName] = require(plugin).default;
        if (console) console.log(`Loaded command plugin for command '${commandName}'.`);
    }

    /**
     * This syntax caused "this" to be undefined in initializeCommandRPCQueue:
     * await Promise.all(Object.keys(plugins).map(messageBroker.initializeCommandRPCQueue));
     * 
     * I think it is because, when map() is called, initializeCommandRPCQueue
     * is used more like a lambda function, rather than actually calling the
     * method.
     */
    await Promise.all(Object.keys(plugins).map((commandName : string) => {
        return messageBroker.initializeCommandRPCQueue(commandName);
    }));
    if (console) console.log("Initialized all command RPC queues.");

    Object.keys(configuration.driverless_authentication_credentials).forEach((username : string) : void => {
        if (console) console.log(`Found credentials for user '${username}' in the driverless authentication database.`);
    });

    const logger : Logger = new ConsoleAndQueueLogger(messageBroker);
    await logger.initialize();

    const server : Server = new Server(configuration, messageBroker, logger, plugins);
})();