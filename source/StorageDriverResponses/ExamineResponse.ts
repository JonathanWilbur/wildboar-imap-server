export
interface ExamineResponse {
    flags : string[];
    exists : number;
    recent : number;
    unseen? : number;
    permanentFlags? : string[];
    uidNext? : number;
    uidValidity? : number;
}