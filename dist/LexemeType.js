"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LexemeType;
(function (LexemeType) {
    LexemeType[LexemeType["EMPTY"] = 0] = "EMPTY";
    LexemeType[LexemeType["WHITESPACE"] = 1] = "WHITESPACE";
    LexemeType[LexemeType["END_OF_COMMAND"] = 2] = "END_OF_COMMAND";
    LexemeType[LexemeType["NEWLINE"] = 3] = "NEWLINE";
    LexemeType[LexemeType["TAG"] = 4] = "TAG";
    LexemeType[LexemeType["COMMAND_NAME"] = 5] = "COMMAND_NAME";
    LexemeType[LexemeType["LIST_START"] = 6] = "LIST_START";
    LexemeType[LexemeType["LIST_END"] = 7] = "LIST_END";
    LexemeType[LexemeType["ATOM"] = 8] = "ATOM";
    LexemeType[LexemeType["QUOTED_STRING"] = 9] = "QUOTED_STRING";
    LexemeType[LexemeType["LITERAL_LENGTH"] = 10] = "LITERAL_LENGTH";
    LexemeType[LexemeType["STRING_LITERAL"] = 11] = "STRING_LITERAL";
    LexemeType[LexemeType["BASE64"] = 12] = "BASE64";
    LexemeType[LexemeType["FLAG"] = 13] = "FLAG";
    LexemeType[LexemeType["NUMBER"] = 14] = "NUMBER";
    LexemeType[LexemeType["NIL"] = 15] = "NIL";
    LexemeType[LexemeType["DATE"] = 16] = "DATE";
    LexemeType[LexemeType["TIME"] = 17] = "TIME";
    LexemeType[LexemeType["ZONE"] = 18] = "ZONE";
    LexemeType[LexemeType["SEQUENCE_SET"] = 19] = "SEQUENCE_SET";
    LexemeType[LexemeType["ABORT"] = 20] = "ABORT";
    LexemeType[LexemeType["SASL_MECHANISM"] = 21] = "SASL_MECHANISM";
})(LexemeType = exports.LexemeType || (exports.LexemeType = {}));
;
//# sourceMappingURL=LexemeType.js.map