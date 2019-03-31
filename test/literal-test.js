const net = require("net");

const socket = net.createConnection(143, "localhost");

socket.on("connect", () => {
    
});

let saidHello = false;
socket.on("data", (data) => {
    if (!saidHello) {
        saidHello = true;
        // socket.write("A5 LOGIN jwilbur password\r\n");
        socket.write("A5 LOGIN {7}\r\njwilbur {8}\r\npassword\r\n");
    }
    console.log(data.toString());
});