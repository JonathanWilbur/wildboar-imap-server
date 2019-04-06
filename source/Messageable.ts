export
interface Messageable {
    topic? : string;
    message : string;
    error? : Error;
    [ otherProperty : string ] : any;
}