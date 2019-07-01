export
function imapPrint (thing?: any): string {
    switch (typeof thing) {
        case ("undefined"): return "NIL";
        case ("object"): {
            if (!thing) return "NIL";
            if (Array.isArray(thing)) {
                return `(${thing.map((item: any): string => imapPrint(item)).join(" ")})`;
            } else {
                return `(${Object.entries(thing).forEach((ent): string => ent[0] + ' ' + imapPrint(ent[1]))})`;
            }
        }
        case ("boolean"): return (thing ? "TRUE" : "FALSE");
        case ("number"): {
            if (Number.isNaN(thing)) return "NIL";
            return `${thing}`;
        }
        case ("string"): {
            if (
                thing.indexOf("\n") !== -1
                || thing.indexOf("\r") !== -1
            ) { // Return a literal
                return `{${thing.length}}\r\n${thing}`;
            }
            else if (
                thing.indexOf("\\") !== -1
                || thing.indexOf("\"") !== -1
            ) { // Return a double-quoted string
                return `"${thing.replace(/"/g, '\"').replace(/\\/g, '\\\\')}"`;
            } // Just return an atom.
            else return thing;
        }
        default: return "NIL";
    }
}