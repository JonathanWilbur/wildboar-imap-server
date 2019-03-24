"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LexemeType;
(function (LexemeType) {
    LexemeType[LexemeType["ERROR"] = 0] = "ERROR";
    LexemeType[LexemeType["EMPTY"] = 1] = "EMPTY";
    LexemeType[LexemeType["WHITESPACE"] = 2] = "WHITESPACE";
    LexemeType[LexemeType["NEWLINE"] = 3] = "NEWLINE";
    LexemeType[LexemeType["TAG"] = 4] = "TAG";
    LexemeType[LexemeType["COMMAND_NAME"] = 5] = "COMMAND_NAME";
    LexemeType[LexemeType["LIST_START"] = 6] = "LIST_START";
    LexemeType[LexemeType["LIST_END"] = 7] = "LIST_END";
    LexemeType[LexemeType["UNQUOTED_STRING"] = 8] = "UNQUOTED_STRING";
    LexemeType[LexemeType["QUOTED_STRING"] = 9] = "QUOTED_STRING";
    LexemeType[LexemeType["LITERAL_LENGTH"] = 10] = "LITERAL_LENGTH";
    LexemeType[LexemeType["FLAG"] = 11] = "FLAG";
    LexemeType[LexemeType["NUMBER"] = 12] = "NUMBER";
    LexemeType[LexemeType["NIL"] = 13] = "NIL";
    LexemeType[LexemeType["DATE"] = 14] = "DATE";
    LexemeType[LexemeType["TIME"] = 15] = "TIME";
    LexemeType[LexemeType["ZONE"] = 16] = "ZONE";
    LexemeType[LexemeType["SEQUENCE_SET"] = 17] = "SEQUENCE_SET";
})(LexemeType || (LexemeType = {}));
exports.default = LexemeType;
