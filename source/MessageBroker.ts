import { UniquelyIdentified } from "wildboar-microservices-ts";

export default
interface MessageBroker extends UniquelyIdentified {
    // publishAuthentication () : void;
    // publishAuthorization () : void;
    publishCommand (authenticatedUser : string, command : string, message : object) : Promise<object>;
    publishEvent (topic : string, message : object) : void;
    closeConnection () : void;
}