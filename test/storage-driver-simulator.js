const amqp = require("amqplib/callback_api");

amqp.connect("amqp://localhost:5672", (err, connection) => {
    connection.createChannel((err, channel) => {

        channel.consume("imap.LIST", (msg) => {
            console.log("Got a LIST message.");
            channel.ack(msg);
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    listItems: [
                        {
                            nameAttributes: [],
                            hierarchyDelimiter: "/",
                            name: "INBOX"
                        }
                    ]
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        });

        channel.consume("imap.LSUB", (msg) => {
            console.log("Got a LSUB message.");
            channel.ack(msg);
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    lsubItems: [
                        {
                            nameAttributes: [],
                            hierarchyDelimiter: "/",
                            name: "INBOX"
                        }
                    ]
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        });

        channel.consume("imap.CREATE", (msg) => {
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    created: true
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        });

        channel.consume("imap.SELECT", (msg) => {
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    flags: [],
                    exists: 180,
                    recent: 3
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        });

        channel.consume("imap.EXAMINE", (msg) => {
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    flags: [],
                    exists: 180,
                    recent: 3
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        });

    });
});