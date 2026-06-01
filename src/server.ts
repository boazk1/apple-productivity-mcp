import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { runJxa } from "./jxa.js";
import { RemindersClient } from "./reminders.js";
import type { ReminderItem, ReminderList, ReminderRunner } from "./types.js";

const listNameSchema = z.string().min(1).optional().describe("Apple Reminders list name.");
const includeCompletedSchema = z.boolean().optional().default(false);
const reminderIdSchema = z.string().min(1).optional().describe("Apple Reminders id from list_reminders or search_reminders.");
export const dueDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "dueDate must be a valid date string.")
  .optional()
  .describe("Optional ISO 8601 due date.");

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

export function createServer(runner: ReminderRunner = runJxa) {
  const client = new RemindersClient(runner);
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
    async () => jsonContent(summarizeLists(await client.listReminderLists()))
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
    async (args) => jsonContent(summarizeReminders(await client.listReminders(args)))
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
    async (args) => jsonContent(summarizeReminders(await client.searchReminders(args)))
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
    async (args) => jsonContent(await client.createReminder(args))
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
    async (args) => jsonContent(await client.completeReminder(args))
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
    async (args) => jsonContent(summarizeReminders(await client.getTodayReminders(args)))
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
    async (args) => jsonContent(summarizeReminders(await client.getOverdueReminders(args)))
  );

  return server;
}
