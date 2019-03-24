import Connection from "./Connection";

export
class CommandPlugin {
    constructor (
        readonly commandName : string,
        readonly callback : (connection : Connection, tag : string) => void
    ) {}
}