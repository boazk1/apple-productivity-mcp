# Contributing

Thanks for helping improve `reminders-mcp`.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The unit tests do not modify Apple Reminders. Code that talks to Reminders is
kept behind `RemindersClient` so behavior can be tested with a fake runner.

## Pull requests

- Keep changes focused and small when possible.
- Add or update tests for behavior changes.
- Document new tools, arguments, and macOS permission requirements.
- Avoid logging reminder titles, notes, list names, or other private data unless
  the user explicitly requested it.

## Local Reminders testing

macOS may prompt for automation permissions the first time an MCP client or
terminal controls Reminders. Test against a disposable Reminders list when
validating create, update, or complete behavior.
