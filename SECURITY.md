# Security Policy

`apple-productivity-mcp` is a local MCP server for private Apple Reminders,
Calendar, Notes, and Contacts data. Please avoid sharing reminder, calendar,
notes, or contact content in public issues.

## Supported versions

Security fixes are provided for the latest published version.

## Reporting a vulnerability

Please open a private security advisory on GitHub if available. If that is not
available, email the maintainer listed on the npm package and include:

- affected version or commit
- impact
- reproduction steps
- any suggested fix

Do not include private reminder, calendar, notes, or contact data unless it is
strictly necessary.

## Security expectations

- The server does not intentionally send reminders, calendar events, notes, or
  contacts to any third-party API.
- Tool responses may contain reminder titles, event titles, note titles, note
  bodies, contact names, emails, phone numbers, locations, due dates, event
  times, and list/folder/calendar names.
- MCP clients connected to this server should be treated as trusted local
  software with access to your Reminders, Calendar, Notes, and Contacts data.
