const amqp = require("amqplib/callback_api");

amqp.connect("amqp://localhost:5672", (err, connection) => {
    connection.createChannel((err, channel) => {

        channel.consume("imap.LIST", (msg) => {
            console.log("Got a LIST message.");
            channel.ack(msg);
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    ok: true,
                    listItems: [
                        {
                            nameAttributes: [],
                            hierarchyDelimiter: "/",
                            name: "INBOX"
                        }
                    ]
                })), {
                    correlationId: msg.properties.correlationId,
                    contentType: "application/json",
                    contentEncoding: "8bit"
                });
        });

        // channel.consume("imap.LSUB", (msg) => {
        //     console.log("Got a LSUB message.");
        //     channel.ack(msg);
        //     channel.sendToQueue(msg.properties.replyTo,
        //         Buffer.from(JSON.stringify({
        //             ok: true,
        //             lsubItems: [
        //                 {
        //                     nameAttributes: [],
        //                     hierarchyDelimiter: "/",
        //                     name: "INBOX"
        //                 }
        //             ]
        //         })), {
        //             correlationId: msg.properties.correlationId,
        //             contentType: "application/json",
        //             contentEncoding: "8bit"
        //         });
        // });

        // channel.consume("imap.CREATE", (msg) => {
        //     channel.ack(msg);
        //     channel.sendToQueue(msg.properties.replyTo,
        //         Buffer.from(JSON.stringify({
        //             ok: true,
        //             created: true
        //         })), {
        //             correlationId: msg.properties.correlationId,
        //             contentType: "application/json",
        //             contentEncoding: "8bit"
        //         });
        // });

        channel.consume("imap.SELECT", (msg) => {
            channel.ack(msg);
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    ok: true,
                    flags: [],
                    exists: 180,
                    recent: 3
                })), {
                    correlationId: msg.properties.correlationId,
                    contentType: "application/json",
                    contentEncoding: "8bit"
                });
        });

        // channel.consume("imap.EXAMINE", (msg) => {
        //     channel.ack(msg);
        //     channel.sendToQueue(msg.properties.replyTo,
        //         Buffer.from(JSON.stringify({
        //             ok: true,
        //             flags: [],
        //             exists: 180,
        //             recent: 3
        //         })), {
        //             correlationId: msg.properties.correlationId,
        //             contentType: "application/json",
        //             contentEncoding: "8bit"
        //         });
        // });

    });
});