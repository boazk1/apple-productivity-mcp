# Integration Tests

Automated unit tests use fake runners and do not touch Apple app data.

Manual integration testing should use disposable Apple app data:

- a Reminders list named `MCP Test`
- a Calendar calendar named `MCP Test`
- a Notes folder named `MCP Test`

Suggested manual checks before a release:

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Then connect the local build to an MCP client and verify:

- list Reminders lists, calendars, and Notes folders
- create a reminder in `MCP Test`
- create a calendar event in `MCP Test`
- create and append to a note in `MCP Test`
- rerun with `APPLE_PRODUCTIVITY_READ_ONLY=1` and confirm write tools are
  blocked

Never run integration tests against important personal data.
