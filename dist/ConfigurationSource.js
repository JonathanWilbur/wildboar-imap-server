"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class ConfigurationSource {
    constructor() {
        this.id = `urn:uuid:${uuid_1.v4()}`;
        this.creationTime = new Date();
        this.configurationOptions = new Set([
            "queue.protocol",
            "queue.server.hostname",
            "queue.server.tcp.listening_port",
            "queue.username",
            "queue.password",
            "imap.server.ip.bind_address",
            "imap.server.tcp.listening_port",
            "imap.server.domain",
            "imap.server.hostname",
            "imap.server.servername",
            "imap.server.greeting",
            "imap.server.permitted_sasl_mechanisms",
            "queue.rpc_message_timeout_in_milliseconds",
            "driverless.authentication.credentials"
        ]);
    }
    static convertStringToBoolean(str) {
        if (/^\s*True\s*$/i.test(str))
            return true;
        if (/^\s*False\s*$/i.test(str))
            return false;
        if (/^\s*Yes\s*$/i.test(str))
            return true;
        if (/^\s*No\s*$/i.test(str))
            return false;
        if (/^\s*T\s*$/i.test(str))
            return true;
        if (/^\s*F\s*$/i.test(str))
            return false;
        if (/^\s*Y\s*$/i.test(str))
            return true;
        if (/^\s*N\s*$/i.test(str))
            return false;
        if (/^\s*1\s*$/i.test(str))
            return true;
        if (/^\s*0\s*$/i.test(str))
            return false;
        if (/^\s*\+\s*$/i.test(str))
            return true;
        if (/^\s*\-\s*$/i.test(str))
            return false;
        return undefined;
    }
    static convertStringToInteger(str) {
        try {
            const ret = Number.parseInt(str);
            if (Number.isNaN(ret))
                return undefined;
            if (!Number.isSafeInteger(ret))
                return undefined;
            return ret;
        }
        catch (e) {
            return undefined;
        }
    }
    static isSASLMechanismNameChar(char) {
        return ((char >= 0x41 && char <= 0x5A) ||
            (char >= 0x30 && char <= 0x39) ||
            (char === 0x2D) ||
            (char === 0x5F));
    }
}
exports.ConfigurationSource = ConfigurationSource;
//# sourceMappingURL=ConfigurationSource.js.map