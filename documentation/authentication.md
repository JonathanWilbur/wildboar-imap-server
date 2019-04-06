# Authentication

- On startup, for all SASL authentication mechanism plugins:
  - Load each plugin
  - Create an RPC message queue
  - Log the plugin loading
- On authentication
  - The scanner 

## How do you tell if an authentication mechanism is available?

- The server starts with a list of explicitly permitted SASL mechanisms, which
  it obtains from the configuration source.
- With this list, it checks the existence of each corresponding message queue.
- The queue's existence itself is an indication that the service is available,
  because the authentication mechanism drivers are supposed to create these
  queues instead of the server, and they should be deleted if no consumers
  remain.
  - With RabbitMQ, this can be achieved with the `autoDelete` option to `assertQueue()`.
  - The IMAP server MUST NOT delete authentication driver queues.
  - The IMAP server MUST create the authentication SASL exchange, `authentication`.
  - The authentication drivers also MUST create the authentication SASL exchange, `authentication`.
  - The authentication drivers also MUST bind their specific mechanism queue(s) the authentication SASL exchange, `authentication`.

## Authentication Service Discovery API

```typescript
public queueExists (queueName : string) : Promise<boolean>;
```

```typescript
public queueHasConsumers (queueName : string) : Promise<boolean>;
```

```typescript
public queuePing (queueName : string) : Promise<boolean>;
```

At startup, `queueExists()` SHALL be used to assume that queues are available.
Then, `queueHasConsumers` SHALL be used periodically to ping a queue for
consumers.

If there are multiple frontends listening on a queue, not all of them need to
ping the queue for consumers. The response from one shall restart the timer
for the others to ping.

`queuePing()` sends a simple `{}` message to the message queue. This is a
standard message. Every Wildboar Microservice MUST treat this as a ping and
respond with any valid JSON object.

## When Will Each Service Discovery Method Be Used?

- At server startup, `queueExists()`.
- Upon the first `CAPABILITY` for a given connection, `queueHasConsumers()` should be
  used to verify driver health. After that, responses should be cached.
  - If this proves too talkative, the caching may need to be updated
    periodically, rather than once per connection.
  - If there is no way to check the number of consumers, this check should
    simply be skipped (what other option is there?) and the cache from
    server startup should be used.
- At `AUTHENTICATE`, `queuePing()`, before the server response is sent.
  - If the method is available, the client is permitted to continue.
  - If the method is not available, the operation is aborted.

## Driverless Authentication Mode

In Driverless Authentication Mode, a configuration directive contains a list of
credential pairs that constitute the authentication database, and this is used
instead of an authentication driver. Each credential pair looks like this:

`<username>:<salted password hash>`

The Salted Password Hash shall be a PBKDF2-derived key from the following
arguments:

- The user's password
- A salt of "PRESS_F_TO_PAY_RESPECCS"
- A Digest of SHA-512
- A key length of 64 bytes
- Iterations shall be 100000.

## Request and Response

The existence of an authenticatedUser field means that the authentication was
successful. This field MUST only be read when done is true.

Responses to completed authentication MAY include the request messages.

Request:

```
{
  messages: [
    "ASweBLJ+ORTqwretJHGOQ/=="
  ]
}
```

Success response:

```
{
  done: true,
  authenticatedUser: "jonathan"
  messages: [
    "ASweBLJ+ORTqwretJHGOQ/=="
  ]
}
```

Failure response:

```
{
  done: true
}
```

Continuation response:

```
{
  done: false,
  nextChallenge: "ASweBLJ+ORTqwretJHGOQ/=="
  messages: [
    "ASweBLJ+ORTqwretJHGOQ/=="
  ]
}
```