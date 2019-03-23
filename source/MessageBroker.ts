import { ExamineResponse, SelectResponse, CreateResponse, DeleteResponse, RenameResponse, SubscribeResponse, UnsubscribeResponse, AppendResponse, CheckResponse, CloseResponse, ExpungeResponse, ListResponse, LsubResponse, StatusResponse, SearchResponse, StoreResponse, CopyResponse, FetchResponse } from "./StorageDriverResponses/index";
import { SequenceSet } from "./SequenceSet";
import { UniquelyIdentified } from "wildboar-microservices-ts";

export default
interface MessageBroker extends UniquelyIdentified {
    select (user : string, mailboxName : string) : Promise<SelectResponse>;
    examine (user : string, mailboxName : string) : Promise<ExamineResponse>;
    create (user : string, mailboxName : string) : Promise<CreateResponse>;
    delete (user : string, mailboxName : string) : Promise<DeleteResponse>;
    rename (user : string, existingMailboxName : string, newMailboxName : string) : Promise<RenameResponse>;
    subscribe (user : string, mailboxName : string) : Promise<SubscribeResponse>;
    unsubscribe (user : string, mailboxName : string) : Promise<UnsubscribeResponse>;
    list (user : string, referenceName : string, mailboxName : string) : Promise<ListResponse>;
    lsub (user : string, referenceName : string, mailboxName : string) : Promise<LsubResponse>;
    status (user : string, mailboxName : string, statusDataItemNames : string[]) : Promise<StatusResponse>;
    append (user : string, mailboxName : string, message : Buffer, flags : string[], dateTime? : Date) : Promise<AppendResponse>; // TODO:
    check (user : string) : Promise<CheckResponse>;
    close (user : string) : Promise<CloseResponse>;
    expunge (user : string) : Promise<ExpungeResponse>;
    search (user : string, searchCriteria : string[], charset : string) : Promise<SearchResponse>;
    fetch (user : string, sequenceSet : SequenceSet, dataItemNames : string[]) : Promise<FetchResponse>; // TODO:
    store (user : string, sequenceSet : SequenceSet, flags : string[], silent : boolean, add? : boolean) : Promise<StoreResponse>; // TODO:
    copy (user : string, sequenceSet : SequenceSet, mailboxName : string) : Promise<CopyResponse>; // TODO:
    uidCopy (user : string, sequenceSet : SequenceSet, mailboxName : string) : Promise<CopyResponse>;
    uidFetch (user : string, sequenceSet : SequenceSet, dataItemNames : string[]) : Promise<FetchResponse>;
    uidStore (user : string, sequenceSet : SequenceSet, flags : string[], silent : boolean, add? : boolean) : Promise<StoreResponse>;  
    uidSearch (user : string, searchCriteria : string[], charset : string) : Promise<SearchResponse>;
    publishEvent (topic : string, message : object) : void;
    closeConnection () : void;
}