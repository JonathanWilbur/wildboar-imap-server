import EnvironmentVariablesConfigurationSource from "./ConfigurationSources/EnvironmentVariables";
import Server from "./Server";

const server : Server = new Server(
    new EnvironmentVariablesConfigurationSource()
);