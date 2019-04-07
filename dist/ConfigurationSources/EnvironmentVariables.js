"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class EnvironmentVariablesConfigurationSource {
    constructor() {
        this.id = `urn:uuid:${uuid_1.v4()}`;
        this.creationTime = new Date();
    }
    initialize() {
        return Promise.resolve(true);
    }
    close() {
        return Promise.resolve(true);
    }
    transformKeyNameToEnvironmentVariableName(key) {
        return key.toUpperCase().replace(/\./g, "_");
    }
    static convertStringToBoolean(str) {
        if (/^\s*True\s*$/i.test(str))
            return true;
        if (/^\s*False\s*$/i.test(str))
            return false;
        if (/^\s*Yes\s*$/i.test(str))
            return true;
        if (/^\s*No\s*$/i.test(str))
            return false;
        if (/^\s*T\s*$/i.test(str))
            return true;
        if (/^\s*F\s*$/i.test(str))
            return false;
        if (/^\s*Y\s*$/i.test(str))
            return true;
        if (/^\s*N\s*$/i.test(str))
            return false;
        if (/^\s*1\s*$/i.test(str))
            return true;
        if (/^\s*0\s*$/i.test(str))
            return false;
        if (/^\s*\+\s*$/i.test(str))
            return true;
        if (/^\s*\-\s*$/i.test(str))
            return false;
        return undefined;
    }
    static convertStringToInteger(str) {
        try {
            const ret = Number.parseInt(str);
            if (Number.isNaN(ret))
                return undefined;
            if (!Number.isSafeInteger(ret))
                return undefined;
            return ret;
        }
        catch (e) {
            return undefined;
        }
    }
    static isSASLMechanismNameChar(char) {
        return ((char >= 0x41 && char <= 0x5A) ||
            (char >= 0x30 && char <= 0x39) ||
            (char === 0x2D) ||
            (char === 0x5F));
    }
    getBoolean(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        return EnvironmentVariablesConfigurationSource.convertStringToBoolean(environmentVariable);
    }
    getInteger(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        return EnvironmentVariablesConfigurationSource.convertStringToInteger(environmentVariable);
    }
    getString(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
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
}
exports.EnvironmentVariablesConfigurationSource = EnvironmentVariablesConfigurationSource;
//# sourceMappingURL=EnvironmentVariables.js.map