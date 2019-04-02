import ConfigurationSource from "./ConfigurationSource";
import EnvironmentVariablesConfigurationSource from "./ConfigurationSources/EnvironmentVariables";
import { Server } from "./Server";
import MessageBroker from "./MessageBroker";
// import { DummyMessageBroker } from "./MessageBrokers/DUMMY";
// import { AMQPMessageBroker } from "./MessageBrokers/AMQP";
import { CommandPlugin } from "./CommandPlugin";
import * as fs from "fs";
import * as path from "path";

const configuration : ConfigurationSource =
    new EnvironmentVariablesConfigurationSource();

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

const commandsDirectory : string = path.join(__dirname, "Commands");
const plugins : { [ commandName : string ] : CommandPlugin } = {};
const commandPluginsIterator = pluginIterator(commandsDirectory);
for (let plugin of commandPluginsIterator) {
    const commandName : string = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
    // TODO: Check that every character is valid for a command.
    plugins[commandName] = require(plugin).default;
    console.log(`Loaded command plugin for command '${commandName}'.`);
}

const messageBrokersDirectory : string = path.join(__dirname, "MessageBrokers");
const messageBrokerProtocols : { [ protocolName : string ] : string } = {};
const messageBrokerPluginsIterator = pluginIterator(messageBrokersDirectory);
for (let plugin of messageBrokerPluginsIterator) {
    const protocolName : string = path.basename(plugin).replace(/\.js$/, "").toUpperCase();
    messageBrokerProtocols[protocolName] = plugin;
    console.log(`Found (but not yet loaded) message broker plugin for protocol '${protocolName}'.`);
}

const queueProtocol : string = configuration.queue_protocol.toUpperCase();
if (!(queueProtocol in messageBrokerProtocols)) {
    console.error(`No message broker plugin is available for the protocol '${queueProtocol}'.`);
    console.error(`Your choices are: ${Object.keys(messageBrokerProtocols).join(", ")}.`);
    process.exit(1);
}

const messageBroker : MessageBroker = 
    new (require(messageBrokerProtocols[queueProtocol]).default)(configuration);
console.log(`Loaded message broker plugin for protocol '${queueProtocol}'.`);

const server : Server = new Server(configuration, messageBroker, plugins);