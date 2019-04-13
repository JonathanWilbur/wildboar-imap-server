# Concurrency

## If responses are written line-by-line, could lines of responses be interlaced?

For instance, if a client quickly runs `SELECT` and `CHECK` back-to-back, could
the server respond like so?

```
* 172 EXISTS
* 1 RECENT
A141 OK CHECK completed
* OK [UNSEEN 12] Message 12 is first unseen
* OK [UIDVALIDITY 3857529045] UIDs valid
* FLAGS (\Answered \Flagged \Deleted \Seen \Draft)
* OK [PERMANENTFLAGS (\Deleted \Seen \*)] Limited
A142 OK [READ-WRITE] SELECT completed
```

This output looks incorrect to me. While I cannot seem to get a direct answer
from the specification, it would appear that this output is actually
acceptable. In RFC 3501, Section 2.2.2:

> A client MUST be prepared to accept any server response at all times.
> This includes server data that was not requested.

And in RFC 3501, Section 7:

> The client MUST be prepared to accept any response at all times.

So it seems that the interlaced lines shown above would be acceptable.

## Even if responses are written all at the same time, is it possible for socket writes to overlap?

I have not studied this via testing, nor can I find resources online
documenting specific details about the perils of concurrent writes
to sockets, but 
[this question](https://stackoverflow.com/questions/21438207/can-node-js-code-result-in-race-conditions)
on Stack Overflow made me remember that NodeJS is actually single-threaded,
and that socket writes may be done asynchronously, but not technically at the
same time. I think that means we are safe.

[This StackOverflow question](https://stackoverflow.com/questions/5481675/node-js-and-mutexes)
seems to suggest the same thing.

If not, if all commands do not write directly to the socket, but rather, write
to an interface that intermediates socket writes, this may be able to be
changed later on. An idea I have is to buffer response messages in a simple
`Buffer[]`, then concatenate them and flush them all at once from a central
point. This could be controlled by traditional concurrency abstractions like
a mutex or conditional variable.

## Is a Denial-of-Service Possible by calling `LOGOUT` shortly after running a command?

Would it be possible to crash this process by issuing a command that writes to
the socket, then shortly thereafter calling `LOGOUT` to close the socket either
before or while it is being written to?

Yes it is! I tested it with `./test/logout-dos.js`. However, the crash would
have originated with the exception handler, which also writes an error message
to the socket. In my case, the program did not actually crash, but there was
an unhandled promise rejection, which _will_ crash future versions of NodeJS.

The solution is to add this check to the start of every socket write:
`if (this.socket.writable)`.

Since this applies to _every_ socket write, it becomes even more important that
socket writes are centralized into the `Connection` object, and a controlled
interface is presented to the command callbacks instead.

For posterity's sake, here is what the indicative errors looked like:

```
imaphost         | (i) Authenticating with username 'jonathan' and password 'bigboi'.
imaphost         | (i) Command 'LOGOUT' executed.
imaphost         | (node:1) UnhandledPromiseRejectionWarning: Error [ERR_STREAM_WRITE_AFTER_END]: write after end
imaphost         |     at writeAfterEnd (_stream_writable.js:248:12)
imaphost         |     at Socket.Writable.write (_stream_writable.js:296:5)
imaphost         |     at Connection.executeCommand (/srv/dist/Connection.js:199:25)
imaphost         |     at processTicksAndRejections (internal/process/next_tick.js:81:5)
imaphost         | (node:1) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 12)
imaphost         | (i) Socket for connection urn:uuid:32760c31-37a2-430f-82fb-481b4eae0197 closed.
```

## Will this implement the NodeJS Cluster API for concurrency?

Probably not, since Worker Threads are more efficient.

## Will this implement the NodeJS Worker Threads API for concurrency?

Maybe. The biggest problems that make me hesitate to implement this are:

- Worker threads cannot be debugged.
- It might get pretty complicated to implement.

Of course, this is experimental right now, so that is a ways off anyway.

[This](https://blog.logrocket.com/node-js-multithreading-what-are-worker-threads-and-why-do-they-matter-48ab102f8b10)
is a pretty good article on Worker Threads.