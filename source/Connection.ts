import * as net from "net";
import { Lexeme } from "./Lexeme";
import { Scanner } from "./Scanner";
import { ScanningState } from "./Scanner"; // TODO: Separate this.
import { Server } from "./Server";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { ConnectionState } from "./ConnectionState";
import { CommandPlugin } from "./CommandPlugin";
import { EventEmitter } from "events";
const uuidv4 : () => string = require("uuid/v4");

export
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly scanner = new Scanner();
    public currentlySelectedMailbox : string = "INBOX";
    public authenticatedUser : string = "";
    public state : ConnectionState = ConnectionState.NOT_AUTHENTICATED;
    private eventEmitter : EventEmitter = new EventEmitter();

    constructor (
        readonly server : Server,
        readonly socket : net.Socket,
        readonly commandPlugins : CommandPlugin[]
    ) {
        this.commandPlugins.forEach((plugin : CommandPlugin) : void => {
            this.eventEmitter.on(plugin.commandName, (connection : Connection, tag : string) : void => {
                plugin.callback(connection, tag, plugin.commandName);
            });
        });

        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", async (data : Buffer) => {
            this.scanner.enqueueData(data);
            switch (<number>this.scanner.state) {
                case (ScanningState.LINE): {
                    while (this.scanner.lineReady) {
                        // try {
                            const tag : Lexeme = await this.scanner.readTag();
                            const command : Lexeme = await this.scanner.readCommand();
                            console.log(`${tag.toString()} ${command.toString()}`);
                            // this.scanner.state = ScanningState.ARGUMENTS;
                            this.eventEmitter.emit(
                                command.toString().toUpperCase(),
                                this,
                                tag.toString()
                            );
                        // } catch (e) {
                        //     console.log(`Error ${e}`);
                        //     this.socket.write("Bad tag or command. Closing connection.\r\n");
                        //     this.close();
                        //     break;
                        // }
                    }
                }
                default: break;
            }
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Bye!`);
        });
    }

    public close () : void {
        this.socket.end();
    }

}