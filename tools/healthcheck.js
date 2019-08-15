const net = require("net");
const port = process.env["IMAP_SERVER_TCP_LISTENING_PORT"] || 143;
const tag = `HC${(new Date()).getMilliseconds()}`;
let sentHealthcheck = false;
setTimeout(() => {
    if (console) {
        console.error(`Healthcheck tool timed out with tag ${tag}.`);
    }
    process.exit(1);
}, 5000);
try {
    const socket = net.createConnection(port, "127.0.0.1", () => {});
    socket.on("data", (data) => {
        if (!sentHealthcheck) {
            socket.write(`${tag} HEALTHCHECK\r\n`);
            sentHealthcheck = true;
        }
        if (data.indexOf(`${tag} OK HEALTHCHECK Completed.`) !== -1) {
            process.exit(0);
        }
    });
    socket.on("error", () => {
        if (console) {
            console.error(`Healthcheck tool errored with tag ${tag}.`);
        }
        process.exit(1);
    });
    socket.on("close", () => {
        if (console) {
            console.error(`Healthcheck tool closed with tag ${tag}.`);
        }
        process.exit(1);
    });
} catch (e) {
    if (console) {
        console.error(`Healthcheck tool failed with tag ${tag}.`);
    }
    process.exit(1);
}
