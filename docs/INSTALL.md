# Installation

`apple-productivity-mcp` runs locally on macOS and connects MCP clients to
Apple Reminders, Calendar, Notes, and Contacts.

## Claude Desktop

Build the project locally:

```sh
npm ci
npm run build
```

Add this to your Claude Desktop MCP configuration:

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

## Cursor

Add an MCP server with:

```json
{
  "command": "node",
  "args": [
    "/absolute/path/to/apple-productivity-mcp/dist/index.js"
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
blocking write tools such as create, update, complete, and append. Contacts
tools are always read-only.

```json
{
  "command": "node",
  "args": [
    "/absolute/path/to/apple-productivity-mcp/dist/index.js"
  ],
  "env": {
    "APPLE_PRODUCTIVITY_READ_ONLY": "1"
  }
}
```

## npm after publishing

After the package is published to npm, MCP client configs can use:

```json
{
  "command": "npx",
  "args": [
    "-y",
    "apple-productivity-mcp"
  ]
}
```

## macOS permissions

Open Reminders, Calendar, Notes, and Contacts at least once before using the
server. On first tool use, macOS may ask whether your MCP client or terminal can
control the relevant app.

If permissions get stuck, check:

System Settings -> Privacy & Security -> Automation

Allow your MCP client or terminal to control Reminders, Calendar, Notes, and
Contacts.
