import * as net from "net";
import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";
import Scanner from "./Scanner";
import { ScanningState } from "./Scanner"; // TODO: Separate this.
import Server from "./Server";
import { Temporal, UniquelyIdentified } from "wildboar-microservices-ts";
import { ConnectionState } from "./ConnectionState";
import { ListItem, ListResponse, LsubItem, LsubResponse, SelectResponse, ExamineResponse, CreateResponse, DeleteResponse, RenameResponse, SubscribeResponse, UnsubscribeResponse } from "./StorageDriverResponses";
// import SASLAuthenticationMechanism from "./SASLAuthenticationMechanism";
// import PlainSASLAuthentication from "./SASLAuthenticationMechanisms/Plain";
import { CommandPlugin } from "./CommandPlugin";
import { EventEmitter } from "events";
const uuidv4 : () => string = require("uuid/v4");

export default
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public readonly scanner = new Scanner();
    // private expectedLexemeType : LexemeType = LexemeType.COMMAND_LINE;
    // private saslAuthenticationMechanism : string = "";
    // private saslAuthenticator : SASLAuthenticationMechanism | undefined;
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
            this.eventEmitter.on(plugin.commandName, plugin.callback);
        });

        this.socket.write(`* OK ${this.server.configuration.imap_server_greeting}\r\n`);
        socket.on("data", (data : Buffer) : void => {
            this.scanner.enqueueData(data);
            switch (<number>this.scanner.state) {
                case (ScanningState.COMMAND_NAME): {
                    if (this.scanner.lineReady) {
                        this.scanner.readTag()
                        .then((tag : string) : void => {
                            this.scanner.readCommand()
                            .then((command : string) : void => {
                                console.log(`${tag} ${command}`);
                                this.eventEmitter.emit(command.toUpperCase(), this, tag);
                            })
                            .catch((rejection : any) : void => {
                                if (rejection) {
                                    // Close the connection.
                                    console.log("Closing connection from command");
                                }
                            });
                        })
                        .catch((rejection : any) : void => {
                            if (rejection) {
                                // Close the connection.
                                console.log("Closing connection from tag");
                            }
                        });
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