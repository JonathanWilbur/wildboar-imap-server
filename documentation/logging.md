- Logging will take place through a generic "event publication" API.
  - The term "event publication" is meant to replace the connotations that
    come with logging: that logs are just "kept" and nothing more. Events can
    be--and are meant to be--used by other programs, but _can_ be read by
    humans.
- The event publication API will publish events both to the console (STDIN and
  STDOUT and STDERR), as well as a message queue.
- This event publication will use two configuration options:
  - events.console_verbosity
  - events.queue_verbosity
- The event to be published shall be submitted through the API, and this event
  will be displayed on the console according to a few rules:
  - If the message has a `message` attribute, and this attribute is a `string`,
    this string, and only this string, shall comprise the entirety of the text
    that appears on the console for the given event, save for timestamps and
    other metadata.