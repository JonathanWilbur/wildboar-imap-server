import { UniquelyIdentified } from "wildboar-microservices-ts";
import { AuthenticationRequest } from "../AuthenticationRequest";
import { ConfigurationSource } from "../ConfigurationSource";
import { Connection } from "../Connection";
import { MessageBroker } from "../MessageBroker";
import { v4 as uuidv4 } from "uuid";
import { AuthorizationRequest } from "../AuthorizationRequest";

export default
class DummyMessageBroker implements MessageBroker, UniquelyIdentified {
    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    constructor (readonly configuration : ConfigurationSource) {}
    public async initialize () : Promise<boolean> {
        return Promise.resolve(true);
    }
    public initializeCommandRPCQueue (commandName : string) : Promise<boolean> {
        return Promise.resolve(true);
    }
    public publishCommand () : Promise<object> {
        return Promise.resolve({
            ok: true
        });
    }
    public publishAuthentication (saslMechanism : string, message : AuthenticationRequest) : Promise<object> {
        return Promise.resolve({});
    }
    public publishAuthorization (connection : Connection, message : AuthorizationRequest) : Promise<object> {
        return Promise.resolve({});
    }
    public publishEvent (topic : string, message : object) : void {}
    public closeConnection () : Promise<boolean> {
        return Promise.resolve(true);
    }
}