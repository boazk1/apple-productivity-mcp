# reminders-mcp

A private, local MCP server that lets AI assistants work with Apple Reminders.

This server runs on your Mac and talks to the local Reminders app through JXA
(JavaScript for Automation). Your reminders are not uploaded to a third-party
API by this package.

## Tools

- `list_reminder_lists` - list all Reminders lists
- `list_reminders` - list reminders, optionally by list and completion state
- `search_reminders` - search reminder titles and notes
- `create_reminder` - create a reminder
- `complete_reminder` - mark a reminder complete by id or unique exact title
- `get_today_reminders` - list incomplete reminders due today
- `get_overdue_reminders` - list incomplete overdue reminders

## Requirements

- macOS with Apple Reminders
- Node.js 20 or newer
- An MCP client such as Claude Desktop, Cursor, or Codex

On first use, macOS may ask for permission to let your terminal or MCP client
control Reminders. Allow it for the server to work.

## Install

```sh
npm install -g reminders-mcp
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
    "reminders": {
      "command": "npx",
      "args": [
        "-y",
        "reminders-mcp"
      ]
    }
  }
}
```

For a local checkout, use the built entrypoint:

```json
{
  "mcpServers": {
    "reminders": {
      "command": "node",
      "args": [
        "/absolute/path/to/reminders-mcp/dist/index.js"
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

## Development

```sh
npm install
npm test
npm run typecheck
npm run build
```

The Reminders bridge is isolated behind `RemindersClient`, so unit tests can run
without opening or modifying your Reminders app.

## Notes

- `complete_reminder` works best with an `id` returned by `list_reminders` or
  `search_reminders`.
- When completing by title, the title must match exactly and only one reminder
  may match.
- Dates should be provided as ISO 8601 strings, for example
  `2026-06-01T09:00:00+02:00`.

## Troubleshooting

If a tool fails with an Apple Reminders automation error:

- Open Reminders once before using the server.
- In System Settings, check Privacy & Security automation permissions for your
  terminal or MCP client.
- If macOS prompts for access to Reminders, allow it and retry the tool call.
