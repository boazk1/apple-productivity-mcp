# Contributing

Thanks for helping improve `reminders-mcp`.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The unit tests do not modify Apple Reminders or Calendar. Code that talks to
Apple apps is kept behind client classes so behavior can be tested with a fake
runner.

## Pull requests

- Keep changes focused and small when possible.
- Add or update tests for behavior changes.
- Document new tools, arguments, and macOS permission requirements.
- Avoid logging reminder titles, event titles, notes, list/calendar names,
  locations, or other private data unless the user explicitly requested it.

## Local Apple app testing

macOS may prompt for automation permissions the first time an MCP client or
terminal controls Reminders or Calendar. Test against a disposable Reminders
list or Calendar calendar when validating create, update, or complete behavior.
