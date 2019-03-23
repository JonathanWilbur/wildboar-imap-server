// sequence-set    = (seq-number / seq-range) *("," sequence-set)
//                     ; set of seq-number values, regardless of order.
//                     ; Servers MAY coalesce overlaps and/or execute the
//                     ; sequence in any order.
//                     ; Example: a message sequence number set of
//                     ; 2,4:7,9,12:* for a mailbox with 15 messages is
//                     ; equivalent to 2,4,5,6,7,9,12,13,14,15
//                     ; Example: a message sequence number set of *:4,5:7
//                     ; for a mailbox with 10 messages is equivalent to
//                     ; 10,9,8,7,6,5,4,5,6,7 and MAY be reordered and
//                     ; overlap coalesced to be 4,5,6,7,8,9,10.

// seq-number      = nz-number / "*"
//                     ; message sequence number (COPY, FETCH, STORE
//                     ; commands) or unique identifier (UID COPY,
//                     ; UID FETCH, UID STORE commands).
//                     ; * represents the largest number in use.  In
//                     ; the case of message sequence numbers, it is
//                     ; the number of messages in a non-empty mailbox.
//                     ; In the case of unique identifiers, it is the
//                     ; unique identifier of the last message in the
//                     ; mailbox or, if the mailbox is empty, the
//                     ; mailbox's current UIDNEXT value.
//                     ; The server should respond with a tagged BAD
//                     ; response to a command that uses a message
//                     ; sequence number greater than the number of
//                     ; messages in the selected mailbox.  This
//                     ; includes "*" if the selected mailbox is empty.

// seq-range       = seq-number ":" seq-number
//                     ; two seq-number values and all values between
//                     ; these two regardless of order.
//                     ; Example: 2:4 and 4:2 are equivalent and indicate
//                     ; values 2, 3, and 4.
//                     ; Example: a unique identifier sequence range of
//                     ; 3291:* includes the UID of the last message in
//                     ; the mailbox, even if that value is less than 3291.

// nz-number       = digit-nz *DIGIT
//                     ; Non-zero unsigned 32-bit integer
//                     ; (0 < n < 4,294,967,296)

// "*" will translate to Infinity.
export
type SequenceSet = (number | { beginning : number, end: number })[];