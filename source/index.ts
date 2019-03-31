import EnvironmentVariablesConfigurationSource from "./ConfigurationSources/EnvironmentVariables";
import { Server } from "./Server";
import * as commands from "./Commands/index";

const server : Server = new Server(
    new EnvironmentVariablesConfigurationSource(),
    {
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
    }
);