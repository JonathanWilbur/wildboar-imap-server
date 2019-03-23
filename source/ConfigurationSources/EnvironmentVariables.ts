import ConfigurationSource from "../ConfigurationSource";
import TypedKeyValueStore from "../TypedKeyValueStore";
const uuidv4 : () => string = require("uuid/v4");

export default
class EnvironmentVariableConfigurationSource implements ConfigurationSource,TypedKeyValueStore {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    private transformKeyNameToEnvironmentVariableName (key : string) : string {
        return key.toUpperCase().replace(/\./g, "_");
    }

    public getBoolean(key : string) : boolean | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        if (/^\s*True\s*$/i.test(environmentVariable)) return true;
        if (/^\s*False\s*$/i.test(environmentVariable)) return false;
        if (/^\s*Yes\s*$/i.test(environmentVariable)) return true;
        if (/^\s*No\s*$/i.test(environmentVariable)) return false;
        if (/^\s*T\s*$/i.test(environmentVariable)) return true;
        if (/^\s*F\s*$/i.test(environmentVariable)) return false;
        if (/^\s*Y\s*$/i.test(environmentVariable)) return true;
        if (/^\s*N\s*$/i.test(environmentVariable)) return false;
        if (/^\s*1\s*$/i.test(environmentVariable)) return true;
        if (/^\s*0\s*$/i.test(environmentVariable)) return false;
        if (/^\s*\+\s*$/i.test(environmentVariable)) return true;
        if (/^\s*\-\s*$/i.test(environmentVariable)) return false;
        return undefined;
    }

    // TODO: Check for NaN, Infinity, etc.
    public getInteger(key : string) : number | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        try {
            return Number(environmentVariable);
        } catch (e) {
            return undefined;
        }
    }

    public getString(key : string) : string | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
    }

    /**
     * The specific directive accessors go below here.
     */

    get queue_server_hostname () : string {
        const DEFAULT_VALUE : string = "localhost";
        const env : string | undefined = this.getString("queue.server.hostname");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get queue_server_tcp_listening_port () : number {
        const DEFAULT_VALUE : number = 5672;
        const env : number | undefined = this.getInteger("queue.server.tcp.listening_port");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get queue_username () : string {
        const DEFAULT_VALUE : string = "";
        const env : string | undefined = this.getString("queue.username");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get queue_password () : string {
        const DEFAULT_VALUE : string = "";
        const env : string | undefined = this.getString("queue.password");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_ip_bind_address () : string {
        const DEFAULT_VALUE : string = "0.0.0.0";
        // const DEFAULT_VALUE : string = "127.0.0.1";
        const env : string | undefined = this.getString("imap.server.ip.bind_address");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_tcp_listening_port () : number {
        const DEFAULT_VALUE : number = 143;
        const env : number | undefined = this.getInteger("imap.server.tcp.listening_port");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_domain () : string {
        const DEFAULT_VALUE : string = "";
        const env : string | undefined = this.getString("imap.server.domain");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_hostname () : string {
        const DEFAULT_VALUE : string = "";
        const env : string | undefined = this.getString("imap.server.hostname");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_servername () : string {
        const DEFAULT_VALUE : string = "Wildboar IMAP Server";
        const env : string | undefined = this.getString("imap.server.servername");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_greeting () : string {
        const DEFAULT_VALUE : string = "Heytherehoss";
        const env : string | undefined = this.getString("imap.server.greeting");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

}