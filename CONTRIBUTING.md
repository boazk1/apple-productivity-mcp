# Contributing

Thanks for helping improve `reminders-mcp`.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The unit tests do not modify Apple Reminders, Calendar, or Notes. Code that
talks to Apple apps is kept behind client classes so behavior can be tested with
a fake runner.

## Pull requests

- Keep changes focused and small when possible.
- Add or update tests for behavior changes.
- Document new tools, arguments, and macOS permission requirements.
- Avoid logging reminder titles, event titles, notes, list/calendar names,
  note bodies, locations, or other private data unless the user explicitly
  requested it.

## Local Apple app testing

macOS may prompt for automation permissions the first time an MCP client or
terminal controls Reminders, Calendar, or Notes. Test against disposable data
when validating create, update, append, or complete behavior.
