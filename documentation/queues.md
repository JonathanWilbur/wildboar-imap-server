The Wildboar IMAP Server will use a RabbitMQ Exchange using direct exchange,
and using the IMAP command as the routing key.

The exceptions are:

- Authentication received from both the `LOGIN` and `AUTHENTICATE` commands
  will be routed to a different authentication exchange, which will also
  use direct exchange whose routing key shall be the SASL mechanism in only
  uppercase characters.
  - A `LOGIN` command shall be treated like `AUTHENTICATE`, but using the
    `PLAIN` SASL mechanism.
- `CAPABILITY`, because it does not do much.
- `NOOP`, because it does not do much.
- `LOGOUT`, because it does not do much.
- `STARTTLS`, because this command will not be supported.

Responses will be sent to the queues specified in the `reply-to` header. These
response queues will be strongly-named per the pattern
`imap.COMMAND.responses-<IMAP Server UUID-URN>`. These response queues will
also be exclusive, meaning that they will be destroyed once their exclusive
subscriber unsubscribes or disconnects from them.

Unfortunately, it appears that RabbitMQ does not support using exchanges in the
`reply-to` header.