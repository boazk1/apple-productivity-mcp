import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CalendarClient } from "./calendar.js";
import { runJxa } from "./jxa.js";
import { NotesClient } from "./notes.js";
import { RemindersClient } from "./reminders.js";
import type { CalendarEvent, CalendarItem, NoteItem, NotesFolder, ReminderItem, ReminderList, ReminderRunner } from "./types.js";

const listNameSchema = z.string().min(1).optional().describe("Apple Reminders list name.");
const calendarNameSchema = z.string().min(1).optional().describe("Apple Calendar name.");
const folderNameSchema = z.string().min(1).optional().describe("Apple Notes folder name.");
const includeCompletedSchema = z.boolean().optional().default(false);
const reminderIdSchema = z.string().min(1).optional().describe("Apple Reminders id from list_reminders or search_reminders.");
const noteIdSchema = z.string().min(1).optional().describe("Apple Notes id from list_notes or search_notes.");
export const dueDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "dueDate must be a valid date string.")
  .optional()
  .describe("Optional ISO 8601 due date.");
export const calendarDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "must be a valid date string.");

function jsonContent(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function summarizeReminders(reminders: ReminderItem[]) {
  return {
    count: reminders.length,
    reminders
  };
}

function summarizeLists(lists: ReminderList[]) {
  return {
    count: lists.length,
    lists
  };
}

function summarizeCalendars(calendars: CalendarItem[]) {
  return {
    count: calendars.length,
    calendars
  };
}

function summarizeEvents(events: CalendarEvent[]) {
  return {
    count: events.length,
    events
  };
}

function summarizeFolders(folders: NotesFolder[]) {
  return {
    count: folders.length,
    folders
  };
}

function summarizeNotes(notes: NoteItem[]) {
  return {
    count: notes.length,
    notes
  };
}

export function createServer(runner: ReminderRunner = runJxa) {
  const reminders = new RemindersClient(runner);
  const calendar = new CalendarClient(runner);
  const notes = new NotesClient(runner);
  const server = new McpServer({
    name: "apple-productivity-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "list_reminder_lists",
    {
      title: "List reminder lists",
      description: "List all Apple Reminders lists available on this Mac.",
      inputSchema: {}
    },
    async () => jsonContent(summarizeLists(await reminders.listReminderLists()))
  );

  server.registerTool(
    "list_reminders",
    {
      title: "List reminders",
      description: "List Apple Reminders, optionally scoped to a list and completed state.",
      inputSchema: {
        listName: listNameSchema,
        includeCompleted: includeCompletedSchema
      }
    },
    async (args) => jsonContent(summarizeReminders(await reminders.listReminders(args)))
  );

  server.registerTool(
    "search_reminders",
    {
      title: "Search reminders",
      description: "Search Apple Reminders by title or notes.",
      inputSchema: {
        query: z.string().min(1).describe("Case-insensitive search query."),
        listName: listNameSchema,
        includeCompleted: includeCompletedSchema
      }
    },
    async (args) => jsonContent(summarizeReminders(await reminders.searchReminders(args)))
  );

  server.registerTool(
    "create_reminder",
    {
      title: "Create reminder",
      description: "Create a new Apple Reminder in a specific list or the default list.",
      inputSchema: {
        title: z.string().min(1).describe("Reminder title."),
        notes: z.string().optional().describe("Optional reminder notes."),
        listName: listNameSchema,
        dueDate: dueDateSchema
      }
    },
    async (args) => jsonContent(await reminders.createReminder(args))
  );

  server.registerTool(
    "complete_reminder",
    {
      title: "Complete reminder",
      description: "Mark an Apple Reminder completed by id, or by exact title when it is unique.",
      inputSchema: {
        id: reminderIdSchema,
        title: z.string().min(1).optional().describe("Exact reminder title. Use id when possible."),
        listName: listNameSchema
      }
    },
    async (args) => jsonContent(await reminders.completeReminder(args))
  );

  server.registerTool(
    "get_today_reminders",
    {
      title: "Get today's reminders",
      description: "List incomplete reminders due today.",
      inputSchema: {
        listName: listNameSchema,
        includeCompleted: includeCompletedSchema
      }
    },
    async (args) => jsonContent(summarizeReminders(await reminders.getTodayReminders(args)))
  );

  server.registerTool(
    "get_overdue_reminders",
    {
      title: "Get overdue reminders",
      description: "List incomplete reminders due before today.",
      inputSchema: {
        listName: listNameSchema
      }
    },
    async (args) => jsonContent(summarizeReminders(await reminders.getOverdueReminders(args)))
  );

  server.registerTool(
    "list_calendars",
    {
      title: "List calendars",
      description: "List all Apple Calendar calendars available on this Mac.",
      inputSchema: {}
    },
    async () => jsonContent(summarizeCalendars(await calendar.listCalendars()))
  );

  server.registerTool(
    "list_calendar_events",
    {
      title: "List calendar events",
      description: "List Apple Calendar events in a date range. Defaults to the next 7 days.",
      inputSchema: {
        calendarName: calendarNameSchema,
        startDate: calendarDateSchema.optional().describe("Optional range start date."),
        endDate: calendarDateSchema.optional().describe("Optional range end date.")
      }
    },
    async (args) => jsonContent(summarizeEvents(await calendar.listEvents(args)))
  );

  server.registerTool(
    "search_calendar_events",
    {
      title: "Search calendar events",
      description: "Search Apple Calendar events by title, notes, or location in a date range.",
      inputSchema: {
        query: z.string().min(1).describe("Case-insensitive search query."),
        calendarName: calendarNameSchema,
        startDate: calendarDateSchema.optional().describe("Optional range start date."),
        endDate: calendarDateSchema.optional().describe("Optional range end date.")
      }
    },
    async (args) => jsonContent(summarizeEvents(await calendar.searchEvents(args)))
  );

  server.registerTool(
    "create_calendar_event",
    {
      title: "Create calendar event",
      description: "Create a new Apple Calendar event in a specific calendar or the default calendar.",
      inputSchema: {
        title: z.string().min(1).describe("Event title."),
        calendarName: calendarNameSchema,
        startDate: calendarDateSchema.describe("Event start date."),
        endDate: calendarDateSchema.describe("Event end date."),
        notes: z.string().optional().describe("Optional event notes."),
        location: z.string().optional().describe("Optional event location."),
        allDay: z.boolean().optional().default(false).describe("Whether this is an all-day event.")
      }
    },
    async (args) => jsonContent(await calendar.createEvent(args))
  );

  server.registerTool(
    "get_today_calendar_events",
    {
      title: "Get today's calendar events",
      description: "List Apple Calendar events happening today.",
      inputSchema: {
        calendarName: calendarNameSchema
      }
    },
    async (args) => jsonContent(summarizeEvents(await calendar.getTodayEvents(args)))
  );

  server.registerTool(
    "get_upcoming_calendar_events",
    {
      title: "Get upcoming calendar events",
      description: "List Apple Calendar events from now through the next 7 days unless a range is provided.",
      inputSchema: {
        calendarName: calendarNameSchema,
        startDate: calendarDateSchema.optional().describe("Optional range start date."),
        endDate: calendarDateSchema.optional().describe("Optional range end date.")
      }
    },
    async (args) => jsonContent(summarizeEvents(await calendar.getUpcomingEvents(args)))
  );

  server.registerTool(
    "list_notes_folders",
    {
      title: "List Notes folders",
      description: "List all Apple Notes folders available on this Mac.",
      inputSchema: {}
    },
    async () => jsonContent(summarizeFolders(await notes.listFolders()))
  );

  server.registerTool(
    "list_notes",
    {
      title: "List notes",
      description: "List Apple Notes, optionally scoped to a folder.",
      inputSchema: {
        folderName: folderNameSchema
      }
    },
    async (args) => jsonContent(summarizeNotes(await notes.listNotes(args)))
  );

  server.registerTool(
    "search_notes",
    {
      title: "Search notes",
      description: "Search Apple Notes by title or body.",
      inputSchema: {
        query: z.string().min(1).describe("Case-insensitive search query."),
        folderName: folderNameSchema
      }
    },
    async (args) => jsonContent(summarizeNotes(await notes.searchNotes(args)))
  );

  server.registerTool(
    "create_note",
    {
      title: "Create note",
      description: "Create a new Apple Note in a specific folder or the default folder.",
      inputSchema: {
        title: z.string().min(1).describe("Note title."),
        body: z.string().optional().describe("Optional note body."),
        folderName: folderNameSchema
      }
    },
    async (args) => jsonContent(await notes.createNote(args))
  );

  server.registerTool(
    "append_to_note",
    {
      title: "Append to note",
      description: "Append text to an Apple Note by id, or by exact title when it is unique.",
      inputSchema: {
        id: noteIdSchema,
        title: z.string().min(1).optional().describe("Exact note title. Use id when possible."),
        folderName: folderNameSchema,
        text: z.string().min(1).describe("Text to append.")
      }
    },
    async (args) => jsonContent(await notes.appendToNote(args))
  );

  return server;
}
