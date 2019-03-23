export
interface SearchRequest {
    criteria : SearchCriteria[]
}

export
interface SearchCriteria {
    // sequenceSet? : 
    answered? : boolean;
    bcc? : string;
    before? : Date;
    body? : string;
    cc? : string;
    deleted? : boolean;
    draft? : boolean;
    flagged? : boolean;
    from? : string;
}