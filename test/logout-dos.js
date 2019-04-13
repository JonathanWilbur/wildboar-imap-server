const net = require("net");
const socket = net.createConnection(143, "localhost");
setTimeout(() => {process.exit(0); }, 30000);
let saidHello = false;
socket.on("data", (data) => {
    if (!saidHello) {
        saidHello = true;
        socket.write("A5 LOGIN jonathan bigboi\r\nA6 LOGOUT\r\n");
    }
    console.log(data.toString());
});