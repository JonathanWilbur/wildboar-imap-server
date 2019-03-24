const enum LexemeType {

    /**
     * Error is a special lexeme type that will be used to signal invalid
     * lexemes. When ERROR is used as the LexemeType, the token of the lexeme
     * shall be an error message.
     */
    ERROR,
    
    EMPTY,

    // COMMAND_LINE,
    // CONTINUATION_LINE,
    WHITESPACE,
    NEWLINE, // CRLF
    // tag             = 1*<any ASTRING-CHAR except "+">
    // ASTRING-CHAR   = ATOM-CHAR / resp-specials
    // atom            = 1*ATOM-CHAR
    // ATOM-CHAR       = <any CHAR except atom-specials>
    // atom-specials   = "(" / ")" / "{" / SP / CTL / list-wildcards /
    //                   quoted-specials / resp-specials
    // %x21-7E, without +
    // resp-specials   = "]"
    TAG,
    COMMAND_NAME,
    LIST_START, // (
    LIST_END, // )
    UNQUOTED_STRING, // $
    QUOTED_STRING, // "$"
    LITERAL_LENGTH, // {#}
    FLAG, // \$$$$
    NUMBER, // #
    NIL,
    DATE, // ##-##-####
    TIME, // ##-##-##
    ZONE,  // +|-####
    SEQUENCE_SET
}
export default LexemeType;