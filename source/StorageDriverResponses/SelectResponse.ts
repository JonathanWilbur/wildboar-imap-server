export
interface SelectResponse {
    flags : string[];
    exists : number;
    recent : number;
    unseen? : number;
    permanentFlags? : string[];
    uidNext? : number;
    uidValidity? : number;
    readOnly? : boolean;
}