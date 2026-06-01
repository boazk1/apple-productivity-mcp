import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CalendarClient } from "./calendar.js";
import { runJxa } from "./jxa.js";
import { RemindersClient } from "./reminders.js";
import type { CalendarEvent, CalendarItem, ReminderItem, ReminderList, ReminderRunner } from "./types.js";

const listNameSchema = z.string().min(1).optional().describe("Apple Reminders list name.");
const calendarNameSchema = z.string().min(1).optional().describe("Apple Calendar name.");
const includeCompletedSchema = z.boolean().optional().default(false);
const reminderIdSchema = z.string().min(1).optional().describe("Apple Reminders id from list_reminders or search_reminders.");
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

export function createServer(runner: ReminderRunner = runJxa) {
  const reminders = new RemindersClient(runner);
  const calendar = new CalendarClient(runner);
  const server = new McpServer({
    name: "reminders-mcp",
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

  return server;
}
