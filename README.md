# Wildboar IMAP Server

* Author: [Jonathan M. Wilbur](https://jonathan.wilbur.space) <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2019
* License: [MIT License](https://mit-license.org/)

Build by running `tsc` in the root directory.

## Usage

### Testing

Run `npm run-script test`.

### Debugging

You can debug easily in VS Code. For some reason, breakpoints do not appear to
work in `index.ts`. 

## Development

### Pre-Alpha

Once the following requirements are met, Wildboar IMAP Server moves into Alpha
development.

- [ ] Commands:
  - [ ] RFC 3501
    - [x] `CAPABILITY`
    - [x] `NOOP`
    - [x] `LOGOUT`
    - [x] `STARTTLS`
    - [x] `AUTHENTICATE`
    - [x] `LOGIN`
    - [x] `SELECT`
    - [ ] `EXAMINE`
    - [x] `CREATE`
    - [ ] `DELETE`
    - [ ] `RENAME`
    - [ ] `SUBSCRIBE`
    - [ ] `UNSUBSCRIBE`
    - [ ] `LIST`
    - [ ] `LSUB`
    - [ ] `STATUS` ("STATUS" SP mailbox SP "(" status-att *(SP status-att) ")") (status-att = "MESSAGES" / "RECENT" / "UIDNEXT" / "UIDVALIDITY" / "UNSEEN")
    - [ ] `APPEND` (hard)
    - [ ] `CHECK`
    - [ ] `CLOSE`
    - [ ] `EXPUNGE`
    - [ ] `SEARCH` (very hard) (And search tricks)
    - [ ] `FETCH` (hard)
    - [ ] `STORE` (medium)
    - [ ] `COPY` (medium)
    - [ ] `UID` (medium)
  - [ ] Custom commands:
    - [ ] `ERROR` (Intentionally throws an error, for testing purposes)
    - [ ] `TRESPASS` (Intentionally rejects on authorization)
    - [ ] `STATISTICS`
    - [ ] `CONNECTIONS`
    - [ ] `CONFIGURATION` (Displays configuration options)
    - [ ] `HEALTHCHECK`
      - [ ] Queue can be reached.
      - [ ] Configuration source can be reached.
      - [ ] Listening on socket.
- [x] Graceful Shutdown
- [x] Add `isSet` to ConfigurationSource.
- [ ] Healthcheck tool
- [ ] Use a `sensitiveCommandRunning` flag to prevent race conditions when a
      connection attempts two `APPEND`s at once, for instance.
- [ ] Limit everything:
  - [ ] Maximum commands per minute.
  - [ ] Time since last command.
  - [x] Maximum command lexemes.
  - [ ] Errors per minute.
  - [ ] Average TCP data chunk size (to prevent Slow Loris attacks)
  - [ ] Average line length.
  - [ ] Authentication attempts per hour should be handled by the authorizer.
- [x] Simple Authorization
- [x] Start-up checks:
  - [x] Confirm that all integers are safe.
  - [x] Confirm that all command names are atoms.
  - [x] Confirm that there are no duplicate plugins.
- [x] Add `capability` field to plugins.
- [ ] Consider using nameless queues to make the queue list more readable.
- [x] Make `ConfigurationSource` a class so you can keep the master variables list there.
- [ ] Create `ok`, `bad`, and `no` methods for replies.
- [ ] Use [`ajv`](https://www.npmjs.com/package/ajv) to validate RPC responses.
  - This is for, among other things, indicating which commands should go through authorization.
- [x] Add `commands_needing_authorization` configuration directive.
- [ ] Is `LexemeType.ERROR` really necessary anymore?
- [ ] Implement an interface for command callbacks to write to the socket in a more controlled manner.

### Alpha

Once the following requirements are met, Wildboar IMAP Server moves into Beta
development.

- [ ] AWS SQS message broker support
- [ ] Update dependencies
- [ ] Use `Set` instead of arrays where uniqueness is a requirement. (Check for `string[]`)
- [ ] Check for correct state at the start of commands.
- [ ] Check `toString()` occurrences for UTF decoding safety.
  - [ ] Flag safe ones with `#UTF_SAFE` comments.
- [ ] Support `SEARCH` tricks
- [x] Address Potential Concurrency Issues: (See `./documentation/concurrency.md`.)
  - [x] If responses are written line-by-line, could lines of responses be interlaced?
  - [x] Even if responses are written all at the same time, is it possible for socket writes to overlap?
  - [x] Is a DoS Possible by calling `LOGOUT` shortly after running a command?
- [ ] Error reporting with the [NodeJS Report API](https://nodejs.org/dist/latest-v11.x/docs/api/report.html)
- [ ] Assertions

### Beta

Once the following requirements are met, Wildboar IMAP Server moves into
Release Candidate development. In Beta, no new features are added to Wildboar
IMAP Server; only testing is performed and bugs are fixed.

- [ ] Static analysis
- [ ] Fuzz testing
- [ ] Achieve 100% test coverage
- [ ] Resilience testing with Chaos Monkey
- [ ] Invalid UTF fuzzing
- [ ] Performance profiling
- [ ] Denial of Service testing
- [ ] Memory leak tests
  - [ ] Repeatedly connecting and disconnecting
  - [ ] Running commands repeatedly
  - [ ] Repeatedly authenticating
- [ ] Test for timing attacks
- [ ] Test for directory traversal

### Release Candidate

Once the following requirements are met, Wildboar IMAP Server version 1.0.0
will be released.

- [ ] 100% JSDoc Documentation
- [ ] User Acceptance Testing

### Future Features

The following features will be added some time after the release of version
1.0.0.

- [ ] Visual Studio Solution
- [ ] Bazel build Configuration
- [ ] Sentry Configuration
- [ ] NPM Tasks
- [ ] Drop capabilities
- [ ] Cryptographically signed messages?
- [ ] Add environment variable for signing up an account for the email list
- [ ] Run each connection in a [NodeJS Worker Thread](https://nodejs.org/dist/latest-v11.x/docs/api/worker_threads.html)