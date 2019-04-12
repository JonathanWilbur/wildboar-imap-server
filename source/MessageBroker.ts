import { AuthenticationRequest } from "./AuthenticationRequest";
import { AuthorizationRequest } from "./AuthorizationRequest";
import { Connection } from "./Connection";
import { UniquelyIdentified } from "wildboar-microservices-ts";

export
interface MessageBroker extends UniquelyIdentified {
    initialize () : Promise<boolean>;
    initializeCommandRPCQueue (commandName : string) : Promise<boolean>;
    publishAuthentication (saslMechanism : string, message : AuthenticationRequest) : Promise<object>;
    publishAuthorization (connection : Connection, message : AuthorizationRequest) : Promise<object>
    publishCommand (authenticatedUser : string, command : string, message : object) : Promise<object>;
    publishEvent (topic : string, message : object) : void;
    closeConnection () : Promise<boolean>;
}