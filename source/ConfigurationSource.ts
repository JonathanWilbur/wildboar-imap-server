import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { TypedKeyValueStore } from "./TypedKeyValueStore";

export
interface ConfigurationSource extends Temporal, TypedKeyValueStore, UniquelyIdentified {
    initialize () : Promise<boolean>;
    close () : Promise<boolean>;
    imap_server_ip_bind_address : string;
    imap_server_tcp_listening_port : number;
    imap_server_domain : string;
    imap_server_hostname : string;
    imap_server_servername : string;
    imap_server_greeting : string;
    imap_server_permitted_sasl_mechanisms : Set<string>;
    queue_protocol : string;
    queue_server_hostname : string;
    queue_server_tcp_listening_port : number;
    queue_username : string;
    queue_password : string;
    queue_rpc_message_timeout_in_milliseconds : number;
    driverless_authentication_credentials : { [ username : string ] : string };
}