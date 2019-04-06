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
    END_OF_COMMAND, // CRLF

    /**
     * `NEWLINE` differs from `END_OF_COMMAND` in that it does not necessarily
     * mean the end of the command. This is primarily used for the
     * `AUTHENTICATE` command, which uses an indeterminate number of lines,
     * and for which, you cannot know if the `CRLF` is truly the end of the
     * command until you attempt an execution.
     */
    NEWLINE,
    TAG,
    COMMAND_NAME,
    LIST_START, // (
    LIST_END, // )
    ATOM, // $
    QUOTED_STRING, // "$"
    LITERAL_LENGTH, // {#}
    STRING_LITERAL,
    BASE64,
    FLAG, // \$$$$
    NUMBER, // #
    NIL,
    DATE, // ##-##-####
    TIME, // ##-##-##
    ZONE,  // +|-####
    SEQUENCE_SET,
    ABORT, // *
    SASL_MECHANISM
};