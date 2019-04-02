"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LexemeType;
(function (LexemeType) {
    LexemeType[LexemeType["ERROR"] = 0] = "ERROR";
    LexemeType[LexemeType["EMPTY"] = 1] = "EMPTY";
    LexemeType[LexemeType["WHITESPACE"] = 2] = "WHITESPACE";
    LexemeType[LexemeType["END_OF_COMMAND"] = 3] = "END_OF_COMMAND";
    LexemeType[LexemeType["TAG"] = 4] = "TAG";
    LexemeType[LexemeType["COMMAND_NAME"] = 5] = "COMMAND_NAME";
    LexemeType[LexemeType["LIST_START"] = 6] = "LIST_START";
    LexemeType[LexemeType["LIST_END"] = 7] = "LIST_END";
    LexemeType[LexemeType["ATOM"] = 8] = "ATOM";
    LexemeType[LexemeType["QUOTED_STRING"] = 9] = "QUOTED_STRING";
    LexemeType[LexemeType["LITERAL_LENGTH"] = 10] = "LITERAL_LENGTH";
    LexemeType[LexemeType["STRING_LITERAL"] = 11] = "STRING_LITERAL";
    LexemeType[LexemeType["FLAG"] = 12] = "FLAG";
    LexemeType[LexemeType["NUMBER"] = 13] = "NUMBER";
    LexemeType[LexemeType["NIL"] = 14] = "NIL";
    LexemeType[LexemeType["DATE"] = 15] = "DATE";
    LexemeType[LexemeType["TIME"] = 16] = "TIME";
    LexemeType[LexemeType["ZONE"] = 17] = "ZONE";
    LexemeType[LexemeType["SEQUENCE_SET"] = 18] = "SEQUENCE_SET";
})(LexemeType = exports.LexemeType || (exports.LexemeType = {}));
;
//# sourceMappingURL=LexemeType.js.map