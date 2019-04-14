"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigurationSource_1 = require("../ConfigurationSource");
class EnvironmentVariablesConfigurationSource extends ConfigurationSource_1.ConfigurationSource {
    initialize() {
        return Promise.resolve(true);
    }
    close() {
        return Promise.resolve(true);
    }
    isSet(setting) {
        const environmentVariableName = EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(setting);
        if (environmentVariableName in process.env)
            return true;
        else
            return false;
    }
    getBoolean(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        return ConfigurationSource_1.ConfigurationSource.convertStringToBoolean(environmentVariable);
    }
    getInteger(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        return ConfigurationSource_1.ConfigurationSource.convertStringToInteger(environmentVariable);
    }
    getString(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
    }
    static transformKeyNameToEnvironmentVariableName(key) {
        return key.toUpperCase().replace(/\./g, "_");
    }
    get queue_protocol() {
        const DEFAULT_VALUE = "AMQP";
        const env = this.getString("queue.protocol");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_server_hostname() {
        const DEFAULT_VALUE = "localhost";
        const env = this.getString("queue.server.hostname");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_server_tcp_listening_port() {
        const DEFAULT_VALUE = 5672;
        const env = this.getInteger("queue.server.tcp.listening_port");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_username() {
        const DEFAULT_VALUE = "";
        const env = this.getString("queue.username");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get queue_password() {
        const DEFAULT_VALUE = "";
        const env = this.getString("queue.password");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_ip_bind_address() {
        const DEFAULT_VALUE = "0.0.0.0";
        const env = this.getString("imap.server.ip.bind_address");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_tcp_listening_port() {
        const DEFAULT_VALUE = 143;
        const env = this.getInteger("imap.server.tcp.listening_port");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_tcp_socket_timeout_in_milliseconds() {
        const DEFAULT_VALUE = 60000;
        const env = this.getInteger("imap.server.tcp.socket_timeout");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_domain() {
        const DEFAULT_VALUE = "";
        const env = this.getString("imap.server.domain");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_hostname() {
        const DEFAULT_VALUE = "";
        const env = this.getString("imap.server.hostname");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_servername() {
        const DEFAULT_VALUE = "Wildboar IMAP Server";
        const env = this.getString("imap.server.servername");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_greeting() {
        const DEFAULT_VALUE = "Heytherehoss";
        const env = this.getString("imap.server.greeting");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_valediction() {
        const DEFAULT_VALUE = "Wow. Just when I thought we were friends.";
        const env = this.getString("imap.server.greeting");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_permitted_sasl_mechanisms() {
        const DEFAULT_VALUE = new Set(["PLAIN"]);
        const env = this.getString("imap.server.permitted_sasl_mechanisms");
        if (!env)
            return DEFAULT_VALUE;
        return new Set(env
            .split(" ")
            .map((mechanism) => mechanism.toUpperCase())
            .filter((mechanism) => {
            if (!(Buffer.from(mechanism))
                .every(EnvironmentVariablesConfigurationSource.isSASLMechanismNameChar))
                return false;
            return true;
        }));
    }
    get queue_rpc_message_timeout_in_milliseconds() {
        const DEFAULT_VALUE = 10000;
        const env = this.getInteger("queue.rpc_message_timeout_in_milliseconds");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get driverless_authentication_credentials() {
        const DEFAULT_VALUE = {};
        const env = this.getString("driverless.authentication.credentials");
        if (!env)
            return DEFAULT_VALUE;
        const ret = {};
        env.split(" ").forEach((pair) => {
            const indexOfColon = pair.indexOf(":");
            if (indexOfColon === -1)
                return;
            const username = pair.slice(0, indexOfColon);
            const passhash = pair.slice(indexOfColon + 1);
            ret[username] = passhash;
        });
        return ret;
    }
    get simple_authorization() {
        const DEFAULT_VALUE = false;
        const env = this.getBoolean("imap.server.simple_authorization");
        if (!env)
            return DEFAULT_VALUE;
        return env;
    }
    get imap_server_commands_requiring_authorization() {
        const DEFAULT_VALUE = new Set([
            "CREATE",
            "DELETE",
            "RENAME",
            "COPY",
            "CLOSE"
        ]);
        const env = this.getString("imap.server.commands_requiring_authorization");
        if (!env)
            return DEFAULT_VALUE;
        const ret = new Set([]);
        env.split(" ").forEach((command) => {
            ret.add(command);
        });
        return ret;
    }
}
exports.EnvironmentVariablesConfigurationSource = EnvironmentVariablesConfigurationSource;
//# sourceMappingURL=EnvironmentVariables.js.map