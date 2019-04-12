# Authorization

Authorization drivers will play only a very limited role in the Wildboar
IMAP Server. To avoid introducing crippling latency only certain commands
will be checked for authorization:

- `LOGIN`
- `AUTHENTICATE`
- `CREATE`
- `DELETE`
- `RENAME`
- `COPY`
- `CLOSE`

Generally speaking, only commands that result in a write or involve
authentication will require authorization. The rationale for this
is that there are not a lot of use cases (that I can think of) for restricting
a user's ability to read their emails, other than implementing login
windows (meaning that a user can only log in at certain times), which
is handled by adding authorization to the `LOGIN` and `AUTHENTICATE`
commands. A user should be able to read and search any email they want,
_so long as it belongs to them_.

On the other hand, requiring authentication for writes makes more sense,
because:

1.  There are more security concerns surrounding writes, since malicious users
    could attempt to exploit vulnerabilities in the IMAP server by writing
    malicious emails, headers, and flags. Though the ability to read could be
    used for exploits, writes give the user more control.
2.  There are a lot more use cases for requiring authorization for writes, such
    as:
    1.  Administrators may want to restrict users' ability to move, copy, or delete emails.
    2.  Administrators may want to restrict users' ability to create, rename or delete folders.
    3.  Administrators may want to restrict what flags users can apply to emails.

Ensuring that users can only read emails that belong to them will be the
responsibility of the storage driver. This makes sense, since there is no way
for the IMAP server to universally check ownership independently of the storage
media being used. For example, when using S3 / Minio / Object storage as the
storage media, directories may be used to namespace ownership, much like
Maildir, but when using MongoDB as the storage media, separate collections may
be created per user to demarcate ownership. To reiterate after providing these
examples, there is no universal way for the IMAP server to check ownership
independently of the media.

You may have considered that email headers, particularly the `To`, `Cc`, or
`Bcc` fields could be used to determine ownership, but this is incorrect,
since:

1.  Email headers could be changed after the fact by users.
    1.  This could be used by malicious users to effectively insert emails
        into another user's folders, bypassing SMTP entirely.
2.  Email headers may not always be present.
3.  The aforementioned headers may refer to email lists or aliases, rather
    than the resulting mailboxes.

## What about an administrative console?

Administrators who need extremely authoritarian control over users may demand
administrative controls that allow them to view and edit all emails, folders,
and flags for all users. Rather than building that functionality into this
IMAP Server at the risk of potentially catastrophic security vulnerabilities
in the future, that shall be handled by an entirely separate administrative
IMAP server.

Though I leave the implementation details to the developers of said
administrative console, I will describe how it might work: it would use
the same messaging broker, configuration source, and storage drivers
that the non-administrative users use, with these notable differences:

- Authorization may be entirely removed, or it may pertain to more commands,
  so that administrators may have more granular permissions.
- The administrative IMAP server would send the same messages to the storage
  driver via the message broker, but, with each message, it would masquerade
  as the owner of the resource being inspected or manipulated.

However, given the much more limited use case of an administrative IMAP server,
it may be more effective for such a server to be implemented as a web
application, rather than another IMAP server, or for direct access to be
granted to the storage media. With direct access to the S3 bucket or MongoDB
database on which the emails are stored, an administrator may have

## Authorization Responses

```json
{
        id: "urn:uuid:123"
        authorized: false,
        reasons: [
                "Too many cooks."
        ]
}
```