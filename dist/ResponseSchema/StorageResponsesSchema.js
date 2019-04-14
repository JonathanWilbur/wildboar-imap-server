"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageDriverResponseSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    title: "Storage driver response",
    definition: {
        type: "object",
        additionalProperties: true,
        properties: {
            ok: {
                type: "boolean"
            },
            statusMessage: {
                type: "string"
            },
            errorsToShowToUser: {
                type: "array",
                items: {
                    type: "string"
                }
            }
        },
        required: [
            "ok"
        ]
    }
};
//# sourceMappingURL=StorageResponsesSchema.js.map