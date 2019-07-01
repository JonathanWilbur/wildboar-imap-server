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

        channel.consume("imap.STATUS", (msg) => {
            channel.ack(msg);
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    ok: true,
                    statusMessage: "Lemme get uhhhhh boneless pizza n uhhhh two liter coke",
                    errorsToShowToUser: [
                        "The gorillas have escaped"
                    ],
                    messages: 13,
                    recent: 5,
                    unseen: 2,
                    uidNext: 543,
                    uidValidity: 22
                })), {
                    correlationId: msg.properties.correlationId,
                    contentType: "application/json",
                    contentEncoding: "8bit"
                });
        });

        channel.consume("imap.FETCH", (msg) => {
            channel.ack(msg);

            const message = JSON.parse(msg.content.toString());
            let fetchedMessages = [
                {
                    id: 15,
                    attributes: [],
                }
            ];
            message.fetchAttributes.forEach(fa => {
                switch (fa.toUpperCase()) {
                    case ("BODY"): {
                        fetchedMessages[0].attributes.push({
                            attribute: fa,
                            value: "YO DAWG",
                        });
                        break;
                    }
                    case ("FLAGS"): {
                        fetchedMessages[0].attributes.push({
                            attribute: fa,
                            value: [
                                "\\Seen",
                                "\\Unseen",
                            ],
                        });
                        break;
                    }
                    case ("RFC822.SIZE"): {
                        fetchedMessages[0].attributes.push({
                            attribute: fa,
                            value: 75,
                        });
                        break;
                    }
                }
            });

            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    ok: true,
                    results: fetchedMessages
                })), {
                    correlationId: msg.properties.correlationId,
                    contentType: "application/json",
                    contentEncoding: "8bit"
                });
        });

    });
});