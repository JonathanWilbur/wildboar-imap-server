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
            if (/^\\[A-Za-z0-9]+$/.test(thing)) { // If it looks like a \Flag
                return thing;
            } else if (thing.indexOf("\n") !== -1 || thing.indexOf("\r") !== -1) { // Return a literal
                return `{${thing.length}}\r\n${thing}`;
            } else if (
                thing.indexOf("\\") !== -1
                || thing.indexOf("\"") !== -1
                || /\s+/g.test(thing) // If there is any whitespace in thing
            ) { // Return a double-quoted string
                return `"${thing.replace(/"/g, '\"').replace(/\\/g, '\\\\')}"`;
            } else return thing; // Just return an atom.
        }
        default: return "NIL";
    }
}