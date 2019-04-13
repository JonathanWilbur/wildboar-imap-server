export
const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    title: "LSUB response",
    type: "object",
    additionalProperties: true,
    properties: {
        ok: {
            type: "boolean"
        },
        lsubItems: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    nameAttributes: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    hierarchyDelimiter: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    }
                },
                required: [
                    "nameAttributes",
                    "hierarchyDelimiter",
                    "name"
                ]
            }
        }
    },
    required: [
        "ok",
        "lsubItems"
    ]
};