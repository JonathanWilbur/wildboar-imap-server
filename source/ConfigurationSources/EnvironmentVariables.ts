import { ConfigurationSource } from "../ConfigurationSource";

export
class EnvironmentVariablesConfigurationSource extends ConfigurationSource {

    public initialize () : Promise<boolean> {
        return Promise.resolve(true);
    }

    public close () : Promise<boolean> {
        return Promise.resolve(true);
    }

    isSet (setting : string) : boolean {
        const environmentVariableName : string =
            EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(setting);
        if (environmentVariableName in process.env) return true;
        else return false;
    }

    public getBoolean (key : string) : boolean | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        return ConfigurationSource.convertStringToBoolean(environmentVariable);
    }

    public getInteger (key : string) : number | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(key);
        const environmentVariable : string | undefined
            = (environmentVariableName in process.env ?
                process.env[environmentVariableName] : undefined);
        if (!environmentVariable) return undefined;
        return ConfigurationSource.convertStringToInteger(environmentVariable);
    }

    public getString (key : string) : string | undefined {
        if (key.length === 0) return undefined;
        const environmentVariableName : string =
            EnvironmentVariablesConfigurationSource.transformKeyNameToEnvironmentVariableName(key);
        return (environmentVariableName in process.env ?
            process.env[environmentVariableName] : undefined);
    }

    public static transformKeyNameToEnvironmentVariableName (key : string) : string {
        return key.toUpperCase().replace(/\./g, "_");
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

    get imap_server_valediction () : string {
        const DEFAULT_VALUE : string = "Wow. Just when I thought we were friends.";
        const env : string | undefined = this.getString("imap.server.greeting");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

    get imap_server_permitted_sasl_mechanisms () : Set<string> {
        const DEFAULT_VALUE : Set<string> = new Set([ "PLAIN" ]);
        const env : string | undefined = this.getString("imap.server.permitted_sasl_mechanisms");
        if (!env) return DEFAULT_VALUE;
        return new Set(env
            .split(" ")
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

    get simple_authorization () : boolean {
        const DEFAULT_VALUE : boolean = false;
        const env : boolean | undefined = this.getBoolean("imap.server.simple_authorization");
        if (!env) return DEFAULT_VALUE;
        return env;
    }

}