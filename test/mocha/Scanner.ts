import { Scanner } from "../../source/Scanner";
import { expect } from "chai";
import "mocha";

describe("Scanner", () : void => {

    // isChar
    // isAtomChar
    // isAtomSpecialChar
    // isControlCharacter
    // isTagChar
    // isDigit
    // isNonZeroDigit
    // isAstringChar

    describe("#isBase64", () : void => {
        it("recognizes base64 characters", () : void => {
            expect(Buffer.from("asdfasdf").every((char : number) : boolean => {
                return Scanner.isBase64Char(char);
            })).to.eq(true);
        });
    
        it("recognizes non-base64 characters");
    });

    // isWhitespace
    // isListWildcardChar
    // isQuotedSpecialChar
    // isResponseSpecialChar
    // isSASLMechanismNameChar
    // isListChar
});