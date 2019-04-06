// WARNING: THIS SHOULD NOT BE USED IN PRODUCTION. IT IS JUST FOR TESTING.

const amqp = require("amqplib");

const USERNAME = "jonathan";
const PASSWORD = "bigboi";

(async () => {
    const cnxn = await amqp.connect("amqp://localhost:5672");
    const channel = await cnxn.createChannel();
    await channel.assertQueue("authentication.PLAIN");
    await channel.bindQueue("authentication.PLAIN", "authentication", "PLAIN");
    channel.consume("authentication.PLAIN", (msg) => {
        console.log("Got a PLAIN authentication request.");
        channel.ack(msg);

        const request = JSON.parse(msg.content.toString());
        if (request.messages.length === 0) {
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    done: false,
                    nextChallenge: (Buffer.from("Please present your PLAIN authentication tuple. ([authzid] authcid passwd)")).toString("base64")
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
            return;
        }
        const triplet = (Buffer.from(request.messages[0], "base64")).toString().split("\x00");
        if (triplet.length !== 3) {
            console.log("Auth was no good.");
            console.log(triplet);
        }
        const [ authzid, authcid, passwd ] = triplet;
        if (authcid === USERNAME && passwd === PASSWORD) {
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    done: true,
                    authenticatedUser: authzid
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        } else {
            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify({
                    done: true
                })), {
                    correlationId: msg.properties.correlationId,
                    content_type: "application/json",
                    content_encoding: "8bit"
                });
        }
    });
})();