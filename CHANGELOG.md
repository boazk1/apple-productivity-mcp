# Changelog

All notable changes to this project will be documented in this file.

This project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and uses semantic versioning once releases begin.

## [Unreleased]

### Added

- Initial Apple Reminders MCP server with list, search, create, complete, today,
  overdue, and list-discovery tools.
- Apple Calendar tools for listing calendars, listing/searching events, creating
  events, and checking today's or upcoming events.
- Apple Notes tools for listing folders, listing/searching notes, creating
  notes, and appending to existing notes.
- Local JXA bridge for private macOS Reminders access.
- TypeScript build, Vitest unit tests, and package metadata.

### Changed

- Renamed the package identity to `apple-productivity-mcp` while keeping the
  existing `reminders-mcp` binary alias for compatibility.

### Security

- Hardened the Reminders automation bridge by whitelisting supported operations,
  limiting request payload size, and passing a minimal environment to `osascript`.

### Fixed

- Accepted ISO due dates with explicit timezone offsets in the MCP tool schema,
  matching the documented `create_reminder` examples.
