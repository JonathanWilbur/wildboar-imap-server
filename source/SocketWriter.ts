/**
 * The sole purpose of this interface is to limit how command callbacks can
 * interact with the socket directly. Among other reasons, implementations
 * of this interface can:
 * 
 * - Automatically apply newlines.
 * - Handle concurrency.
 * - Ensure that the socket is actually writeable before writing.
 */
export
interface SocketWriter {
    writeStatus (tag : string, type : string, code : string, command : string, message : string) : void;
    writeData (message : string) : void;
    writeContinuationRequest (message : string) : void;
    writeOk (tag : string, command : string) : void;
}