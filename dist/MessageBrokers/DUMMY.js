"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
class DummyMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
    }
    publishCommand() {
        return Promise.resolve({});
    }
    publishEvent(topic, message) { }
    closeConnection() { }
}
exports.default = DummyMessageBroker;
//# sourceMappingURL=DUMMY.js.map