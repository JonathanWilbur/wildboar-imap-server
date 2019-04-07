"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const ConsoleAndQueueLogger_1 = require("./Loggers/ConsoleAndQueueLogger");
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Scanner_1 = require("./Scanner");
const Server_1 = require("./Server");
function* pluginIterator(directoryName) {
    const directorySet = new Set(fs.readdirSync(directoryName, { encoding: "utf8" }));
    for (let entry of directorySet.values()) {
        const fullEntryPath = path.join(directoryName, entry);
        const stat = fs.statSync(fullEntryPath);
        if (stat.isDirectory()) {
            const subdirectory = pluginIterator(fullEntryPath);
            let iteration = subdirectory.next();
            while (!iteration.done) {
                yield iteration.value;
                iteration = subdirectory.next();
            }
        }
        else if (fullEntryPath.endsWith(".js") && stat.isFile())
            yield fullEntryPath;
    }
}
process.stdin.resume();
(async () => {
    const configuration = new EnvironmentVariables_1.EnvironmentVariablesConfigurationSource();
    await configuration.initialize();
    const messageBrokersDirectory = path.join(__dirname, "MessageBrokers");
    const messageBrokerProtocols = {};
    const messageBrokerPluginsIterator = pluginIterator(messageBrokersDirectory);
    for (let plugin of messageBrokerPluginsIterator) {
        const protocolName = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
        messageBrokerProtocols[protocolName] = plugin;
        if (console)
            console.log(`Found (but not yet loaded) message broker plugin for protocol '${protocolName}'.`);
    }
    const queueProtocol = configuration.queue_protocol.toUpperCase();
    if (!(queueProtocol in messageBrokerProtocols)) {
        if (console)
            console.error(`No message broker plugin is available for the protocol '${queueProtocol}'.`);
        if (console)
            console.error(`Your choices are: ${Object.keys(messageBrokerProtocols).join(", ")}.`);
        process.exit(1);
    }
    const messageBroker = new (require(messageBrokerProtocols[queueProtocol]).default)(configuration);
    await messageBroker.initialize();
    if (console)
        console.log(`Loaded message broker plugin for protocol '${queueProtocol}'.`);
    const commandsDirectory = path.join(__dirname, "Commands");
    const plugins = {};
    const commandPluginsIterator = pluginIterator(commandsDirectory);
    for (let plugin of commandPluginsIterator) {
        const commandName = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
        if ((Buffer.from(commandName)).every(Scanner_1.Scanner.isAtomChar)) {
            plugins[commandName] = require(plugin).default;
            if (console)
                console.log(`Loaded command plugin for command '${commandName}'.`);
        }
        else {
            if (console)
                console.error(`Invalid command name for plugin: ${commandName}. This plugin cannot be loaded, so it will be skipped.`);
        }
    }
    await Promise.all(Object.keys(plugins).map((commandName) => {
        return messageBroker.initializeCommandRPCQueue(commandName);
    }));
    if (console)
        console.log("Initialized all command RPC queues.");
    Object.keys(configuration.driverless_authentication_credentials).forEach((username) => {
        if (console)
            console.log(`Found credentials for user '${username}' in the driverless authentication database.`);
    });
    const logger = new ConsoleAndQueueLogger_1.ConsoleAndQueueLogger(messageBroker);
    await logger.initialize();
    const server = new Server_1.Server(configuration, messageBroker, logger, plugins);
})();
//# sourceMappingURL=index.js.map