"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentVariables_1 = require("./ConfigurationSources/EnvironmentVariables");
const Server_1 = require("./Server");
const fs = require("fs");
const path = require("path");
const configuration = new EnvironmentVariables_1.default();
function* pluginIterator(directoryName) {
    const entries = fs.readdirSync(directoryName, { encoding: "utf8" });
    for (let i = 0; i < entries.length; i++) {
        const fullEntryPath = path.join(directoryName, entries[i]);
        if (fs.statSync(fullEntryPath).isDirectory()) {
            const subdirectory = pluginIterator(fullEntryPath);
            let iteration = subdirectory.next();
            while (!iteration.done) {
                yield iteration.value;
                iteration = subdirectory.next();
            }
        }
        else if (fullEntryPath.endsWith(".js")) {
            yield fullEntryPath;
        }
    }
}
const commandsDirectory = path.join(__dirname, "Commands");
const plugins = {};
const commandPluginsIterator = pluginIterator(commandsDirectory);
for (let plugin of commandPluginsIterator) {
    const commandName = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
    plugins[commandName] = require(plugin).default;
    console.log(`Loaded command plugin for command '${commandName}'.`);
}
const messageBrokersDirectory = path.join(__dirname, "MessageBrokers");
const messageBrokerProtocols = {};
const messageBrokerPluginsIterator = pluginIterator(messageBrokersDirectory);
for (let plugin of messageBrokerPluginsIterator) {
    const protocolName = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
    messageBrokerProtocols[protocolName] = plugin;
    console.log(`Found (but not yet loaded) message broker plugin for protocol '${protocolName}'.`);
}
const queueProtocol = configuration.queue_protocol.toUpperCase();
if (!(queueProtocol in messageBrokerProtocols)) {
    console.error(`No message broker plugin is available for the protocol '${queueProtocol}'.`);
    console.error(`Your choices are: ${Object.keys(messageBrokerProtocols).join(", ")}.`);
    process.exit(1);
}
const messageBroker = new (require(messageBrokerProtocols[queueProtocol]).default)(configuration);
console.log(`Loaded message broker plugin for protocol '${queueProtocol}'.`);
const server = new Server_1.Server(configuration, messageBroker, plugins);
//# sourceMappingURL=index.js.map