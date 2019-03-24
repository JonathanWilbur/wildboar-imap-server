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
        this.scanner = new Scanner_1.default();
        this.currentlySelectedMailbox = "INBOX";
        this.authenticatedUser = "";
        this.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
        this.eventEmitter = new events_1.EventEmitter();
        this.commandPlugins.forEach((plugin) => {
            this.eventEmitter.on(plugin.commandName, plugin.callback);
        });
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data) => {
            this.scanner.enqueueData(data);
            switch (this.scanner.state) {
                case (Scanner_2.ScanningState.COMMAND_NAME): {
                    if (this.scanner.lineReady) {
                        this.scanner.readTag()
                            .then((tag) => {
                            this.scanner.readCommand()
                                .then((command) => {
                                console.log(`${tag} ${command}`);
                                this.eventEmitter.emit(command.toUpperCase(), this, tag);
                            })
                                .catch((rejection) => {
                                if (rejection) {
                                    console.log("Closing connection from command");
                                }
                            });
                        })
                            .catch((rejection) => {
                            if (rejection) {
                                console.log("Closing connection from tag");
                            }
                        });
                    }
                }
                default: break;
            }
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
    }
    executeCapability(tag) {
        const command = "CAPABILITY";
        this.socket.write(`* ${command} ${this.server.capabilities.join(" ")}\r\n`);
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
    executeNoop(tag) {
        const command = "NOOP";
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
    executeLogout(tag) {
        const command = "LOGOUT";
        this.socket.write("* BYE\r\n");
        this.socket.write(`${tag} OK ${command} Completed.\r\n`);
    }
    executeSelect(tag, args) {
        const command = "SELECT";
        this.server.messageBroker.select(this.authenticatedUser, args[0].toString())
            .then((response) => {
            this.socket.write(`* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK ${response.readOnly ? "[READ-ONLY]" : "[READ-WRITE]"} ${command} Completed.\r\n`);
        });
    }
    executeExamine(tag, args) {
        const command = "EXAMINE";
        this.server.messageBroker.select(this.authenticatedUser, args[0].toString())
            .then((response) => {
            this.socket.write(`* ${response.exists} EXISTS\r\n` +
                `* ${response.recent} RECENT\r\n` +
                `* FLAGS (${response.flags.map((flag) => ("\\" + flag)).join(" ")})\r\n` +
                `${tag} OK [READ-ONLY] ${command} Completed.\r\n`);
        });
    }
    executeCreate(tag, args) {
        const command = "CREATE";
        this.server.messageBroker.create(this.authenticatedUser, args[0].toString())
            .then((response) => {
            if (response.created)
                this.socket.write(`${tag} OK ${command} Completed.`);
            else
                this.socket.write(`${tag} NO ${command} Failed.`);
        });
    }
    executeDelete(tag, args) {
        const command = "DELETE";
        this.server.messageBroker.delete(this.authenticatedUser, args[0].toString())
            .then((response) => {
            if (response.deleted)
                this.socket.write(`${tag} OK ${command} Completed.`);
            else
                this.socket.write(`${tag} NO ${command} Failed.`);
        });
    }
    executeRename(tag, args) {
        const command = "RENAME";
        this.server.messageBroker.rename(this.authenticatedUser, args[0].toString(), args[1].toString())
            .then((response) => {
            if (response.renamed)
                this.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else
                this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }
    executeSubscribe(tag, args) {
        const command = "SUBSCRIBE";
        this.server.messageBroker.subscribe(this.authenticatedUser, args[0].toString())
            .then((response) => {
            if (response.subscribed)
                this.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else
                this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }
    executeUnsubscribe(tag, args) {
        const command = "UNSUBSCRIBE";
        this.server.messageBroker.unsubscribe(this.authenticatedUser, args[0].toString())
            .then((response) => {
            if (response.unsubscribed)
                this.socket.write(`${tag} OK ${command} Completed.\r\n`);
            else
                this.socket.write(`${tag} NO ${command} Failed.\r\n`);
        });
    }
    executeList(tag, args) {
    }
    executeLsub(tag, args) {
    }
    executeStatus(tag, args) {
    }
}
exports.default = Connection;
