import { UniquelyIdentified } from "wildboar-microservices-ts";
import { ConfigurationSource } from "../ConfigurationSource";
import { MessageBroker } from "../MessageBroker";
const uuidv4 : () => string = require("uuid/v4");

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
        return Promise.resolve({});
    }
    public publishAuthentication (saslMechanism : string, message : object) : Promise<object> {
        return Promise.resolve({});
    }
    public publishEvent (topic : string, message : object) : void {}
    public closeConnection () : void {}
}