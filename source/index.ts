import EnvironmentVariablesConfigurationSource from "./ConfigurationSources/EnvironmentVariables";
import Server from "./Server";
import {
    CAPABILITY_COMMAND,
    CHECK_COMMAND,
    CLOSE_COMMAND,
    CREATE_COMMAND,
    DELETE_COMMAND,
    EXAMINE_COMMAND,
    EXPUNGE_COMMAND,
    LOGIN_COMMAND,
    LOGOUT_COMMAND,
    LIST_COMMAND,
    LSUB_COMMAND,
    NOOP_COMMAND,
    RENAME_COMMAND,
    SELECT_COMMAND,
    STARTTLS_COMMAND,
    SUBSCRIBE_COMMAND,
    UNSUBSCRIBE_COMMAND
} from "./Commands/index";

const server : Server = new Server(
    new EnvironmentVariablesConfigurationSource(),
    [
        CAPABILITY_COMMAND,
        CHECK_COMMAND,
        CLOSE_COMMAND,
        CREATE_COMMAND,
        DELETE_COMMAND,
        EXAMINE_COMMAND,
        EXPUNGE_COMMAND,
        LOGIN_COMMAND,
        LOGOUT_COMMAND,
        LIST_COMMAND,
        LSUB_COMMAND,
        NOOP_COMMAND,
        RENAME_COMMAND,
        SELECT_COMMAND,
        STARTTLS_COMMAND,
        SUBSCRIBE_COMMAND,
        UNSUBSCRIBE_COMMAND
    ]
);