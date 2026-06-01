# Security Policy

`reminders-mcp` is a local MCP server for private Apple Reminders and Calendar
data. Please avoid sharing reminder or calendar content in public issues.

## Supported versions

Security fixes are provided for the latest published version.

## Reporting a vulnerability

Please open a private security advisory on GitHub if available. If that is not
available, email the maintainer listed on the npm package and include:

- affected version or commit
- impact
- reproduction steps
- any suggested fix

Do not include private reminder or calendar data unless it is strictly necessary.

## Security expectations

- The server does not intentionally send reminders or calendar events to any
  third-party API.
- Tool responses may contain reminder titles, event titles, notes, locations,
  due dates, event times, and list or calendar names.
- MCP clients connected to this server should be treated as trusted local
  software with access to your Reminders and Calendar data.
