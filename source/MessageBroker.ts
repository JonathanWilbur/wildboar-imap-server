import { UniquelyIdentified } from "wildboar-microservices-ts";

export
interface MessageBroker extends UniquelyIdentified {
    initializeCommandRPCQueue (commandName : string) : void;
    // publishAuthentication () : void;
    // publishAuthorization () : void;
    publishCommand (authenticatedUser : string, command : string, message : object) : Promise<object>;
    publishEvent (topic : string, message : object) : void;
    closeConnection () : void;
}