import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";

export
interface SelectRequest {
    server : UniquelyIdentified & Temporal & { [ prop : string] : any },
    connection : UniquelyIdentified & Temporal & { [ prop : string] : any },
    messageBroker : UniquelyIdentified & { [ prop : string] : any },
    configuration : UniquelyIdentified & { [ prop : string] : any }
}