"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Scanner_1 = require("./Scanner");
const Scanner_2 = require("./Scanner");
const ConnectionState_1 = require("./ConnectionState");
const events_1 = require("events");
const uuidv4 = require("uuid/v4");
class Connection {
    constructor(server, socket, commandPlugins) {
        this.server = server;
        this.socket = socket;
        this.commandPlugins = commandPlugins;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.Scanner();
        this.currentlySelectedMailbox = "INBOX";
        this.authenticatedUser = "";
        this.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
        this.eventEmitter = new events_1.EventEmitter();
        this.commandPlugins.forEach((plugin) => {
            this.eventEmitter.on(plugin.commandName, (connection, tag) => {
                plugin.callback(connection, tag, plugin.commandName);
            });
        });
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", async (data) => {
            this.scanner.enqueueData(data);
            switch (this.scanner.state) {
                case (Scanner_2.ScanningState.LINE): {
                    while (this.scanner.lineReady) {
                        const tag = await this.scanner.readTag();
                        const command = await this.scanner.readCommand();
                        console.log(`${tag.toString()} ${command.toString()}`);
                        this.eventEmitter.emit(command.toString().toUpperCase(), this, tag.toString());
                    }
                }
                default: break;
            }
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
    }
    close() {
        this.socket.end();
    }
}
exports.Connection = Connection;
