export
interface FetchResponse {
    fetched : boolean;
    parts: {
        [ partSpecifier : string ] : string;
    }
}