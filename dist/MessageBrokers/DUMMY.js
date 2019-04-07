"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
class DummyMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuid_1.v4()}`;
        this.creationTime = new Date();
    }
    async initialize() {
        return Promise.resolve(true);
    }
    initializeCommandRPCQueue(commandName) {
        return Promise.resolve(true);
    }
    publishCommand() {
        return Promise.resolve({});
    }
    publishAuthentication(saslMechanism, message) {
        return Promise.resolve({});
    }
    publishEvent(topic, message) { }
    closeConnection() {
        return Promise.resolve(true);
    }
}
exports.default = DummyMessageBroker;
//# sourceMappingURL=DUMMY.js.map