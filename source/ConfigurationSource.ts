import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";

export default
interface ConfigurationSource extends Temporal, UniquelyIdentified {
    imap_server_ip_bind_address : string;
    imap_server_tcp_listening_port : number;
    imap_server_domain : string;
    imap_server_hostname : string;
    imap_server_servername : string;
    imap_server_greeting : string;
    queue_server_hostname : string;
    queue_server_tcp_listening_port : number;
    queue_username : string;
    queue_password : string;
}