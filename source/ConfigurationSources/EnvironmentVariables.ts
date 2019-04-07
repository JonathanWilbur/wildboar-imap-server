import { ConfigurationSource } from "../ConfigurationSource";
import { TypedKeyValueStore } from "../TypedKeyValueStore";
import { v4 as uuidv4 } from "uuid";

export
class EnvironmentVariablesConfigurationSource implements ConfigurationSource,TypedKeyValueStore {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    public initialize () : Promise<boolean> {
        return Promise.resolve(true);
    }

    public close () : Promise<boolean> {
        return Promise.resolve(true);
    }

    private transformKeyNameToEnvironmentVariableName (key : string) : string {
        return key.toUpperCase().replace(/\./g, "_");
    }

    public static convertStringToBoolean (str : string) : boolean | undefined {
        if (/^\s*True\s*$/i.test(str)) return true;
        if (/^\s*False\s*$/i.test(str)) return false;
        if (/^\s*Yes\s*$/i.test(str)) return true;
        if (/^\s*No\s*$/i.test(str)) return false;
        if (/^\s*T\s*$/i.test(str)) return true;
        if (/^\s*F\s*$/i.test(str)) return false;
        if (/^\s*Y\s*$/i.test(str)) return true;
        if (/^\s*N\s*$/i.test(str)) return false;
        if (/^\s*1\s*$/i.test(str)) return true;
        if (/^\s*0\s*$/i.test(str)) return false;
        if (/^\s*\+\s*$/i.test(str)) return true;
        if (/^\s*\-\s*$/i.test(str)) return false;
        return undefined;
    }

    public static convertStringToInteger (str : string) : number | undefined {
        try {
            const ret : number = Number.parseInt(str);
            if (Number.isNaN(ret)) return undefined;
            if (!Number.isSafeInteger(ret)) return undefined;
            return ret;
        } catch (e) {
            return undefined;
        }
    }

    // From IETF RFC 4422, Section 3.1:
    // sasl-mech    = 1*20mech-char
    // mech-char    = UPPER-ALPHA / DIGIT / HYPHEN / UNDERSCORE
    // ; mech-char is restricted to A-Z (uppercase only), 0-9, -, and _
    // ; from ASCII character set.
    public static isSASLMechanismNameChar (char : number) : boolean {
        return (
            (char >= 0x41 && char <= 0x5A) ||
            (char >= 0x30 && char <= 0x39) ||
            (char === 0x2D) ||
            (char === 0x5F)
        );
    }

    public getBoolean (key : string) : boolean | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        return EnvironmentVariablesConfigurationSource.convertStringToBoolean(environmentVariable);
    }

    public getInteger (key : string) : number | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        return EnvironmentVariablesConfigurationSource.convertStringToInteger(environmentVariable);
    }

    public getString (key : string) : string | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            this.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
    }

    /**
     * The specific directive accessors go below here.
     */

    get queue_protocol () : string {
        const DEFAULT_VALUE : string = "AMQP";
        const env : string | undefined = this.getString("queue.protocol");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

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

    get imap_server_permitted_sasl_mechanisms () : Set<string> {
        const DEFAULT_VALUE : Set<string> = new Set([ "PLAIN" ]);
        const env : string | undefined = this.getString("imap.server.permitted_sasl_mechanisms");
        if (!env) return DEFAULT_VALUE;
        const ret : string[] = env.split(" ");
        return new Set(ret
            .map((mechanism : string) : string => mechanism.toUpperCase())
            .filter((mechanism : string) : boolean => {
                if (!(Buffer.from(mechanism))
                .every(EnvironmentVariablesConfigurationSource.isSASLMechanismNameChar))
                    return false;
                return true;
            }));
    }

    get queue_rpc_message_timeout_in_milliseconds () : number {
        const DEFAULT_VALUE : number = 10000;
        const env : number | undefined = this.getInteger("queue.rpc_message_timeout_in_milliseconds");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get driverless_authentication_credentials () : { [ username : string ] : string } {
        const DEFAULT_VALUE : { [ username : string ] : string } = {};
        const env : string | undefined = this.getString("driverless.authentication.credentials");
        if (!env) return DEFAULT_VALUE;
        const ret : { [ username : string ] : string } = {};
        env.split(" ").forEach((pair : string) : void => {
            const indexOfColon : number = pair.indexOf(":");
            if (indexOfColon === -1) return;
            const username : string = pair.slice(0, indexOfColon);
            const passhash : string = pair.slice(indexOfColon + 1);
            ret[username] = passhash;
        });
        return ret;
    }

}