export
interface StoreResponse {
    stored : boolean;
    fetchResponses : StoreItem[];
}

export
interface StoreItem {
    sequenceNumber : number;
    flags : string[];
}