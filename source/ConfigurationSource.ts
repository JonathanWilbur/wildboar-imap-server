import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { TypedKeyValueStore } from "./TypedKeyValueStore";
import { v4 as uuidv4 } from "uuid";

export
abstract class ConfigurationSource implements Temporal, TypedKeyValueStore, UniquelyIdentified {
    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    public readonly configurationOptions : Set<string> = new Set<string>([
        "queue.protocol",
        "queue.server.hostname",
        "queue.server.tcp.listening_port",
        "queue.username",
        "queue.password",
        "imap.server.ip.bind_address",
        "imap.server.tcp.listening_port",
        "imap.server.domain",
        "imap.server.hostname",
        "imap.server.servername",
        "imap.server.greeting",
        "imap.server.permitted_sasl_mechanisms",
        "queue.rpc_message_timeout_in_milliseconds",
        "driverless.authentication.credentials"
    ]);

    public abstract initialize () : Promise<boolean>;
    public abstract close () : Promise<boolean>;
    public abstract isSet (setting : string) : boolean;
    public abstract getBoolean (key : string) : boolean | undefined;
    public abstract getInteger (key : string) : number | undefined;
    public abstract getString (key : string) : string | undefined;
    public abstract imap_server_ip_bind_address : string;
    public abstract imap_server_tcp_listening_port : number;
    public abstract imap_server_domain : string;
    public abstract imap_server_hostname : string;
    public abstract imap_server_servername : string;
    public abstract imap_server_greeting : string;
    public abstract imap_server_permitted_sasl_mechanisms : Set<string>;
    public abstract queue_protocol : string;
    public abstract queue_server_hostname : string;
    public abstract queue_server_tcp_listening_port : number;
    public abstract queue_username : string;
    public abstract queue_password : string;
    public abstract queue_rpc_message_timeout_in_milliseconds : number;
    public abstract driverless_authentication_credentials : { [ username : string ] : string };

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
}