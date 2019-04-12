export
interface AuthorizationRequest {
    protocol? : string;
    protocolVersion? : number;
    server? : {
        id : string;
        creationTime? : Date;
    },
    messageBroker? : {
        id : string;
        creationTime? : Date;
        messagesRead? : number;
    },
    connection? : {
        id : string;
        creationTime? : Date;
        currentlySelectedMailbox? : string;
        authenticatedUser? : string;
        connectionState : number;
        socket? : {
            localFamily? : string;
            localAddress? : string;
            localPort? : number;
            remoteFamily? : string;
            remoteAddress? : string;
            remotePort? : number;
        },
        // TODO: This could get a lot larger.
        transportSecurity? : {
            protocol : string;
            protocolVersion : string;
            cipherSuite? : string;
            clientCertificateChain? : object[];
            serverCertificateChain? : object[];
            serverNameIndication? : string;
            sessionReused? : boolean;
        }
    },
    command : {
        tag? : string,
        name : string,
        args : string[]
    },
    [ key : string ] : any;
}