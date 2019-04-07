import { AuthenticationRequest } from "./AuthenticationRequest";
import { UniquelyIdentified } from "wildboar-microservices-ts";

export
interface MessageBroker extends UniquelyIdentified {
    initialize () : Promise<boolean>;
    initializeCommandRPCQueue (commandName : string) : Promise<boolean>;
    publishAuthentication (saslMechanism : string, message : AuthenticationRequest) : Promise<object>;
    // publishAuthorization () : void;
    publishCommand (authenticatedUser : string, command : string, message : object) : Promise<object>;
    publishEvent (topic : string, message : object) : void;
    closeConnection () : Promise<boolean>;
}