import { Messageable } from "./Messageable";

export
interface Logger {
    initialize () : Promise<boolean>;
    close () : Promise<boolean>;
    debug (event : Messageable) : void;
    info (event : Messageable) : void;
    warn (event : Messageable) : void;
    error (event : Messageable) : void;
}