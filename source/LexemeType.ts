export
const enum LexemeType {
    /**
     * Error is a special lexeme type that will be used to signal invalid
     * lexemes. When ERROR is used as the LexemeType, the token of the lexeme
     * shall be an error message.
     */
    ERROR,
    EMPTY,
    WHITESPACE,
    NEWLINE, // CRLF
    TAG,
    COMMAND_NAME,
    LIST_START, // (
    LIST_END, // )
    ATOM, // $
    QUOTED_STRING, // "$"
    LITERAL_LENGTH, // {#}
    STRING_LITERAL,
    FLAG, // \$$$$
    NUMBER, // #
    NIL,
    DATE, // ##-##-####
    TIME, // ##-##-##
    ZONE,  // +|-####
    SEQUENCE_SET
};