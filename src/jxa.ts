import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { ReminderRunner } from "./types.js";

const execFileAsync = promisify(execFile);
const MAX_INPUT_BYTES = 64 * 1024;
const ALLOWED_OPERATIONS = new Set([
  "listReminderLists",
  "listReminders",
  "searchReminders",
  "createReminder",
  "completeReminder"
]);

const SCRIPT = String.raw`
ObjC.import("stdlib");

function fail(message) {
  throw new Error(message);
}

function parseInput() {
  const raw = $.getenv("REMINDERS_MCP_INPUT");
  if (!raw) {
    return {};
  }
  return JSON.parse(ObjC.unwrap(raw));
}

function nullableDate(value) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

function serializeReminder(reminder, listName) {
  return {
    id: reminder.id(),
    title: reminder.name(),
    notes: reminder.body() || null,
    completed: Boolean(reminder.completed()),
    dueDate: nullableDate(reminder.dueDate()),
    listName
  };
}

function getList(app, listName) {
  if (!listName) {
    const lists = app.lists();
    if (!lists.length) {
      fail("No reminder lists are available.");
    }
    return lists[0];
  }

  const list = app.lists.byName(listName);
  try {
    list.name();
    return list;
  } catch (_error) {
    fail('Reminder list "' + listName + '" was not found.');
  }
}

function allReminders(app, options) {
  const targetLists = options.listName ? [getList(app, options.listName)] : app.lists();
  const includeCompleted = Boolean(options.includeCompleted);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const results = [];
  for (const list of targetLists) {
    const listName = list.name();
    for (const reminder of list.reminders()) {
      const item = serializeReminder(reminder, listName);
      if (!includeCompleted && item.completed) {
        continue;
      }

      const due = item.dueDate ? new Date(item.dueDate) : null;
      if (options.dateFilter === "today" && (!due || due < startOfToday || due >= startOfTomorrow)) {
        continue;
      }
      if (options.dateFilter === "overdue" && (!due || due >= startOfToday || item.completed)) {
        continue;
      }

      results.push(item);
    }
  }

  return results;
}

function createReminder(app, options) {
  const list = getList(app, options.listName);
  const properties = {
    name: options.title
  };

  if (options.notes) {
    properties.body = options.notes;
  }
  if (options.dueDate) {
    const date = new Date(options.dueDate);
    if (Number.isNaN(date.getTime())) {
      fail("dueDate must be a valid date string.");
    }
    properties.dueDate = date;
  }

  const reminder = app.Reminder(properties);
  list.reminders.push(reminder);
  return serializeReminder(reminder, list.name());
}

function completeReminder(app, options) {
  if (!options.id && !options.title) {
    fail("Either id or title is required.");
  }

  const matches = allReminders(app, {
    listName: options.listName,
    includeCompleted: true,
    dateFilter: "all"
  }).filter((item) => {
    if (options.id) {
      return item.id === options.id;
    }
    return item.title.toLowerCase() === options.title.toLowerCase();
  });

  if (matches.length === 0) {
    fail("No matching reminder was found.");
  }
  if (matches.length > 1) {
    fail("Multiple reminders matched. Retry with a reminder id or listName.");
  }

  const list = getList(app, matches[0].listName);
  const reminder = list.reminders.byId(matches[0].id);
  reminder.completed = true;
  return serializeReminder(reminder, matches[0].listName);
}

function run(operation, input) {
  const app = Application("/System/Applications/Reminders.app");
  app.includeStandardAdditions = true;

  switch (operation) {
    case "listReminderLists":
      return app.lists().map((list) => ({
        id: list.id(),
        name: list.name()
      }));
    case "listReminders":
      return allReminders(app, input);
    case "searchReminders": {
      const query = input.query.toLowerCase();
      return allReminders(app, input).filter((item) =>
        item.title.toLowerCase().includes(query) ||
        (item.notes || "").toLowerCase().includes(query)
      );
    }
    case "createReminder":
      return createReminder(app, input);
    case "completeReminder":
      return completeReminder(app, input);
    default:
      fail("Unknown operation: " + operation);
  }
}

JSON.stringify(run($.getenv("REMINDERS_MCP_OPERATION"), parseInput()));
`;

export const runJxa: ReminderRunner = async <T>(operation: string, payload?: unknown) => {
  if (!ALLOWED_OPERATIONS.has(operation)) {
    throw new Error(`Unsupported Reminders operation: ${operation}`);
  }

  const input = JSON.stringify(payload ?? {});
  if (Buffer.byteLength(input, "utf8") > MAX_INPUT_BYTES) {
    throw new Error("Reminders request payload is too large.");
  }

  let stdout = "";

  try {
    const result = await execFileAsync("osascript", ["-l", "JavaScript", "-e", SCRIPT], {
      env: createAutomationEnv(operation, input),
      maxBuffer: 1024 * 1024 * 10
    });
    stdout = result.stdout;
  } catch (error) {
    const message = extractOsascriptError(error);
    throw new Error(`Apple Reminders automation failed: ${message}`);
  }

  const output = stdout.trim();
  if (!output) {
    throw new Error("Reminders returned an empty response.");
  }

  return JSON.parse(output) as T;
};

export function createAutomationEnv(operation: string, input: string): NodeJS.ProcessEnv {
  return {
    HOME: process.env.HOME,
    LANG: process.env.LANG,
    LC_ALL: process.env.LC_ALL,
    PATH: process.env.PATH ?? "/usr/bin:/bin:/usr/sbin:/sbin",
    REMINDERS_MCP_INPUT: input,
    REMINDERS_MCP_OPERATION: operation,
    USER: process.env.USER
  };
}

function extractOsascriptError(error: unknown) {
  if (typeof error === "object" && error !== null && "stderr" in error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? "").trim();
    const lines = stderr.split("\n").map((line) => line.trim());
    let executionError: string | undefined;
    for (const line of lines) {
      if (line.includes("execution error:")) {
        executionError = line;
      }
    }

    if (executionError) {
      return executionError.replace(/^execution error:\s*/, "");
    }
    if (stderr) {
      return stderr;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
