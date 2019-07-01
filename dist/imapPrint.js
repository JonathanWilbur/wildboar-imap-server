"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function imapPrint(thing) {
    switch (typeof thing) {
        case ("undefined"): return "NIL";
        case ("object"): {
            if (!thing)
                return "NIL";
            if (Array.isArray(thing)) {
                return `(${thing.map((item) => imapPrint(item)).join(" ")})`;
            }
            else {
                return `(${Object.entries(thing).forEach((ent) => ent[0] + ' ' + imapPrint(ent[1]))})`;
            }
        }
        case ("boolean"): return (thing ? "TRUE" : "FALSE");
        case ("number"): {
            if (Number.isNaN(thing))
                return "NIL";
            return `${thing}`;
        }
        case ("string"): {
            if (/^\\[A-Za-z0-9]+$/.test(thing)) {
                return thing;
            }
            else if (thing.indexOf("\n") !== -1 || thing.indexOf("\r") !== -1) {
                return `{${thing.length}}\r\n${thing}`;
            }
            else if (thing.indexOf("\\") !== -1
                || thing.indexOf("\"") !== -1
                || /\s+/g.test(thing)) {
                return `"${thing.replace(/"/g, '\"').replace(/\\/g, '\\\\')}"`;
            }
            else
                return thing;
        }
        default: return "NIL";
    }
}
exports.imapPrint = imapPrint;
//# sourceMappingURL=imapPrint.js.map