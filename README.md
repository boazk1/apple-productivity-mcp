# apple-productivity-mcp

[![CI](https://github.com/boazk1/reminders-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/boazk1/reminders-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/apple-productivity-mcp.svg)](https://www.npmjs.com/package/apple-productivity-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A private, local MCP server that lets AI assistants work with Apple Reminders
Apple Calendar, and Apple Notes.

This server runs on your Mac and talks to the local Reminders, Calendar, and
Notes apps through JXA (JavaScript for Automation). Your reminders, calendar
events, and notes are not uploaded to a third-party API by this package.

## Tools

- `list_reminder_lists` - list all Reminders lists
- `list_reminders` - list reminders, optionally by list and completion state
- `search_reminders` - search reminder titles and notes
- `create_reminder` - create a reminder
- `complete_reminder` - mark a reminder complete by id or unique exact title
- `get_today_reminders` - list incomplete reminders due today
- `get_overdue_reminders` - list incomplete overdue reminders
- `list_calendars` - list all Calendar calendars
- `list_calendar_events` - list events in a date range
- `search_calendar_events` - search events by title, notes, or location
- `create_calendar_event` - create a calendar event
- `get_today_calendar_events` - list events happening today
- `get_upcoming_calendar_events` - list events in the next 7 days
- `list_notes_folders` - list all Notes folders
- `list_notes` - list notes, optionally by folder
- `search_notes` - search note titles and bodies
- `create_note` - create a note
- `append_to_note` - append text to a note

## Requirements

- macOS with Apple Reminders, Apple Calendar, and Apple Notes
- Node.js 20 or newer
- An MCP client such as Claude Desktop, Cursor, or Codex

On first use, macOS may ask for permission to let your terminal or MCP client
control Reminders, Calendar, or Notes. Allow it for the server to work.

## Install

```sh
npm install -g apple-productivity-mcp
```

For local development:

```sh
npm install
npm run build
npm run dev
```

## Claude Desktop

Add this to your Claude Desktop MCP config:

```json
{
  "mcpServers": {
    "apple-productivity": {
      "command": "npx",
      "args": [
        "-y",
        "apple-productivity-mcp"
      ]
    }
  }
}
```

For a local checkout, use the built entrypoint:

```json
{
  "mcpServers": {
    "apple-productivity": {
      "command": "node",
      "args": [
        "/absolute/path/to/apple-productivity-mcp/dist/index.js"
      ]
    }
  }
}
```

## Example prompts

- "What reminders are due today?"
- "Add a reminder to cancel my trial next Friday."
- "Show overdue reminders from Work."
- "Search my reminders for passport."
- "Mark the reminder with this id complete."
- "What is on my calendar today?"
- "Schedule a focus block tomorrow from 9 to 10."
- "Find calendar events mentioning project kickoff."
- "Find my notes about the launch plan."
- "Create a note with these meeting takeaways."
- "Append this checklist to my project note."

## Development

```sh
npm install
npm test
npm run typecheck
npm run build
```

Apple app access is isolated behind small client classes, so unit tests can run
without opening or modifying your Reminders, Calendar, or Notes data.

## Project

- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Notes

- `complete_reminder` works best with an `id` returned by `list_reminders` or
  `search_reminders`.
- When completing by title, the title must match exactly and only one reminder
  may match.
- Dates should be provided as ISO 8601 strings, for example
  `2026-06-01T09:00:00+02:00`.

## Troubleshooting

If a tool fails with an Apple app automation error:

- Open the relevant Apple app once before using the server.
- In System Settings, check Privacy & Security automation permissions for your
  terminal or MCP client.
- If macOS prompts for access to Reminders, Calendar, or Notes, allow it and
  retry the tool call.
