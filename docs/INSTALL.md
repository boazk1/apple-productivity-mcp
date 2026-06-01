# Installation

`apple-productivity-mcp` runs locally on macOS and connects MCP clients to
Apple Reminders, Calendar, and Notes.

## Claude Desktop

Add this to your Claude Desktop MCP configuration:

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

## Cursor

Add an MCP server with:

```json
{
  "command": "npx",
  "args": [
    "-y",
    "apple-productivity-mcp"
  ]
}
```

## Local checkout

```sh
npm ci
npm run build
node dist/index.js
```

Then point your MCP client at:

```json
{
  "command": "node",
  "args": [
    "/absolute/path/to/apple-productivity-mcp/dist/index.js"
  ]
}
```

## Read-only mode

Set `APPLE_PRODUCTIVITY_READ_ONLY=1` to keep read/search tools enabled while
blocking write tools such as create, update, complete, and append.

```json
{
  "command": "npx",
  "args": [
    "-y",
    "apple-productivity-mcp"
  ],
  "env": {
    "APPLE_PRODUCTIVITY_READ_ONLY": "1"
  }
}
```

## macOS permissions

Open Reminders, Calendar, and Notes at least once before using the server. On
first tool use, macOS may ask whether your MCP client or terminal can control
the relevant app.

If permissions get stuck, check:

System Settings -> Privacy & Security -> Automation

Allow your MCP client or terminal to control Reminders, Calendar, and Notes.
