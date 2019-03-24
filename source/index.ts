import EnvironmentVariablesConfigurationSource from "./ConfigurationSources/EnvironmentVariables";
import Server from "./Server";
import { CAPABILITY_COMMAND, CREATE_COMMAND, LOGIN_COMMAND, LIST_COMMAND, LSUB_COMMAND } from "./Commands/index";

const server : Server = new Server(
    new EnvironmentVariablesConfigurationSource(),
    [
        CAPABILITY_COMMAND,
        CREATE_COMMAND,
        LOGIN_COMMAND,
        LIST_COMMAND,
        LSUB_COMMAND
    ]
);