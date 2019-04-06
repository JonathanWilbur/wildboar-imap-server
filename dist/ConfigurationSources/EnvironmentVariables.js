"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
class EnvironmentVariablesConfigurationSource {
    constructor() {
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
    }
    initialize() {
        return Promise.resolve(true);
    }
    transformKeyNameToEnvironmentVariableName(key) {
        return key.toUpperCase().replace(/\./g, "_");
    }
    getBoolean(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        if (/^\s*True\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*False\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*Yes\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*No\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*T\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*F\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*Y\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*N\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*1\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*0\s*$/i.test(environmentVariable))
            return false;
        if (/^\s*\+\s*$/i.test(environmentVariable))
            return true;
        if (/^\s*\-\s*$/i.test(environmentVariable))
            return false;
        return undefined;
    }
    getInteger(key) {
        if (key.length === 0)
            return undefined;
        const environmentVariableName = this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable = (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
        if (!environmentVariable)
            return undefined;
        try {
            return Number(environmentVariable);
        }
        catch (e) {
            return undefined;
        }
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
        const DEFAULT_VALUE = ["PLAIN"];
        const env = this.getString("imap.server.permitted_sasl_mechanisms");
        if (!env)
            return DEFAULT_VALUE;
        return env.split(" ");
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