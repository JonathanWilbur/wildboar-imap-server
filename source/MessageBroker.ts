import { UniquelyIdentified } from "wildboar-microservices-ts";

export default
interface MessageBroker extends UniquelyIdentified {
    publishEvent (topic : string, message : object) : void;
    close () : void;
}