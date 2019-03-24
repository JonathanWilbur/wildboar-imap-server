"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Scanner_1 = require("./Scanner");
const ConnectionState_1 = require("./ConnectionState");
const uuidv4 = require("uuid/v4");
class Connection {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.default();
        this.currentlySelectedMailbox = "INBOX";
        this.authenticatedUser = "";
        this.state = ConnectionState_1.ConnectionState.NOT_AUTHENTICATED;
        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data) => {
            this.scanner.enqueueData(data);
            let line = this.scanner.scanLine();
            console.log(line);
            const tag = line[0].token.toString();
            const command = line[1].token.toString();
            this.dispatchCommand(command, tag, line.slice(2));
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
    }
    dispatchCommand(command, tag, args) {
        switch (command.toUpperCase()) {
            case ("CAPABILITY"):
                this.executeCapability(tag);
                break;
            case ("NOOP"):
                this.executeNoop(tag);
                break;
            case ("LOGOUT"):
                this.executeLogout(tag);
                break;
            case ("LOGIN"):
                this.executeLogin(tag, args);
                break;
            case ("SELECT"):
                this.executeSelect(tag, args);
                break;
            case ("EXAMINE"):
                this.executeExamine(tag, args);
                break;
            case ("CREATE"):
                this.executeCreate(tag, args);
                break;
            case ("DELETE"):
                this.executeDelete(tag, args);
                break;
            case ("SUBSCRIBE"):
                this.executeSubscribe(tag, args);
                break;
            case ("UNSUBSCRIBE"):
                this.executeUnsubscribe(tag, args);
                break;
            default: {
                console.log("Unrecognized command. Received this:");
                console.log(`TAG: ${tag}`);
                console.log(`COMMAND: ${command}`);
                console.log(`ARGUMENTS: ${args}`);
            }
        }
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
    executeLogin(tag, args) {
        const command = "LOGIN";
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
