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
  "completeReminder",
  "updateReminder",
  "listCalendars",
  "listCalendarEvents",
  "searchCalendarEvents",
  "createCalendarEvent",
  "updateCalendarEvent",
  "listNotesFolders",
  "listNotes",
  "searchNotes",
  "createNote",
  "appendToNote",
  "updateNote"
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

function updateReminder(app, options) {
  if (!options.id) {
    fail("id is required.");
  }

  const matches = allReminders(app, {
    listName: options.listName,
    includeCompleted: true,
    dateFilter: "all"
  }).filter((item) => item.id === options.id);

  if (matches.length === 0) {
    fail("No matching reminder was found.");
  }

  const list = getList(app, matches[0].listName);
  const reminder = list.reminders.byId(options.id);

  if (Object.prototype.hasOwnProperty.call(options, "title")) {
    reminder.name = options.title;
  }
  if (Object.prototype.hasOwnProperty.call(options, "notes")) {
    reminder.body = options.notes || "";
  }
  if (Object.prototype.hasOwnProperty.call(options, "dueDate")) {
    reminder.dueDate = options.dueDate ? parseDate(options.dueDate, "dueDate") : null;
  }

  return serializeReminder(reminder, matches[0].listName);
}

function calendarApp() {
  return Application("/System/Applications/Calendar.app");
}

function serializeCalendar(calendar) {
  return {
    id: calendar.id(),
    name: calendar.name(),
    color: calendar.color() || null
  };
}

function serializeEvent(event, calendarName) {
  return {
    id: event.id(),
    title: event.summary(),
    notes: event.description() || null,
    location: event.location() || null,
    startDate: new Date(event.startDate()).toISOString(),
    endDate: new Date(event.endDate()).toISOString(),
    allDay: Boolean(event.alldayEvent()),
    calendarName
  };
}

function getCalendar(app, calendarName) {
  if (!calendarName) {
    const calendars = app.calendars();
    if (!calendars.length) {
      fail("No calendars are available.");
    }
    return calendars[0];
  }

  const calendar = app.calendars.byName(calendarName);
  try {
    calendar.name();
    return calendar;
  } catch (_error) {
    fail('Calendar "' + calendarName + '" was not found.');
  }
}

function parseDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    fail(label + " must be a valid date string.");
  }
  return date;
}

function allCalendarEvents(app, options) {
  const start = parseDate(options.startDate, "startDate");
  const end = parseDate(options.endDate, "endDate");
  if (end <= start) {
    fail("endDate must be after startDate.");
  }

  const targetCalendars = options.calendarName ? [getCalendar(app, options.calendarName)] : app.calendars();
  const results = [];

  for (const calendar of targetCalendars) {
    const calendarName = calendar.name();
    for (const event of calendar.events()) {
      const eventEnd = new Date(event.endDate());
      const eventStart = new Date(event.startDate());
      if (eventEnd <= start || eventStart >= end) {
        continue;
      }
      results.push(serializeEvent(event, calendarName));
    }
  }

  return results.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function createCalendarEvent(app, options) {
  const calendar = getCalendar(app, options.calendarName);
  const start = parseDate(options.startDate, "startDate");
  const end = parseDate(options.endDate, "endDate");
  if (end <= start) {
    fail("endDate must be after startDate.");
  }

  const properties = {
    summary: options.title,
    startDate: start,
    endDate: end,
    alldayEvent: Boolean(options.allDay)
  };

  if (options.notes) {
    properties.description = options.notes;
  }
  if (options.location) {
    properties.location = options.location;
  }

  const event = app.Event(properties);
  calendar.events.push(event);
  return serializeEvent(event, calendar.name());
}

function updateCalendarEvent(app, options) {
  if (!options.id) {
    fail("id is required.");
  }

  const calendars = options.calendarName ? [getCalendar(app, options.calendarName)] : app.calendars();
  for (const calendar of calendars) {
    const calendarName = calendar.name();
    for (const event of calendar.events()) {
      if (event.id() !== options.id) {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(options, "title")) {
        event.summary = options.title;
      }
      if (Object.prototype.hasOwnProperty.call(options, "notes")) {
        event.description = options.notes || "";
      }
      if (Object.prototype.hasOwnProperty.call(options, "location")) {
        event.location = options.location || "";
      }
      if (Object.prototype.hasOwnProperty.call(options, "allDay")) {
        event.alldayEvent = Boolean(options.allDay);
      }
      if (Object.prototype.hasOwnProperty.call(options, "startDate")) {
        event.startDate = parseDate(options.startDate, "startDate");
      }
      if (Object.prototype.hasOwnProperty.call(options, "endDate")) {
        event.endDate = parseDate(options.endDate, "endDate");
      }
      if (new Date(event.endDate()) <= new Date(event.startDate())) {
        fail("endDate must be after startDate.");
      }

      return serializeEvent(event, calendarName);
    }
  }

  fail("No matching calendar event was found.");
}

function notesApp() {
  return Application("/System/Applications/Notes.app");
}

function plainText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(value) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((paragraph) => "<p>" + escapeHtml(paragraph).replace(/\n/g, "<br>") + "</p>")
    .join("");
}

function serializeFolder(folder) {
  return {
    id: folder.id(),
    name: folder.name()
  };
}

function serializeNote(note, folderName) {
  return {
    id: note.id(),
    title: note.name(),
    body: plainText(note.body()),
    folderName,
    createdAt: nullableDate(note.creationDate()),
    updatedAt: nullableDate(note.modificationDate())
  };
}

function getFolder(app, folderName) {
  if (!folderName) {
    const folders = app.folders();
    if (!folders.length) {
      fail("No Notes folders are available.");
    }
    return folders[0];
  }

  const folder = app.folders.byName(folderName);
  try {
    folder.name();
    return folder;
  } catch (_error) {
    fail('Notes folder "' + folderName + '" was not found.');
  }
}

function allNotes(app, options) {
  const targetFolders = options.folderName ? [getFolder(app, options.folderName)] : app.folders();
  const results = [];

  for (const folder of targetFolders) {
    const folderName = folder.name();
    for (const note of folder.notes()) {
      results.push(serializeNote(note, folderName));
    }
  }

  return results.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function findSingleNote(app, options) {
  if (!options.id && !options.title) {
    fail("Either id or title is required.");
  }

  const matches = allNotes(app, { folderName: options.folderName }).filter((note) => {
    if (options.id) {
      return note.id === options.id;
    }
    return note.title.toLowerCase() === options.title.toLowerCase();
  });

  if (matches.length === 0) {
    fail("No matching note was found.");
  }
  if (matches.length > 1) {
    fail("Multiple notes matched. Retry with a note id or folderName.");
  }

  const folder = getFolder(app, matches[0].folderName);
  return {
    folder,
    folderName: matches[0].folderName,
    note: folder.notes.byId(matches[0].id)
  };
}

function createNote(app, options) {
  const folder = getFolder(app, options.folderName);
  const body = "<h1>" + escapeHtml(options.title) + "</h1>" + paragraphs(options.body || "");
  const note = app.Note({
    name: options.title,
    body
  });

  folder.notes.push(note);
  return serializeNote(note, folder.name());
}

function appendToNote(app, options) {
  const found = findSingleNote(app, options);
  const currentBody = found.note.body() || "";
  found.note.body = currentBody + paragraphs("\n" + options.text);
  return serializeNote(found.note, found.folderName);
}

function updateNote(app, options) {
  if (!options.id) {
    fail("id is required.");
  }

  const found = findSingleNote(app, options);

  if (Object.prototype.hasOwnProperty.call(options, "title")) {
    found.note.name = options.title;
  }
  if (Object.prototype.hasOwnProperty.call(options, "body")) {
    found.note.body = "<h1>" + escapeHtml(options.title || found.note.name()) + "</h1>" + paragraphs(options.body || "");
  }

  return serializeNote(found.note, found.folderName);
}

function run(operation, input) {
  switch (operation) {
    case "listReminderLists":
    case "listReminders":
    case "searchReminders":
    case "createReminder":
    case "completeReminder":
    case "updateReminder":
      return runReminders(operation, input);
    case "listCalendars":
    case "listCalendarEvents":
    case "searchCalendarEvents":
    case "createCalendarEvent":
    case "updateCalendarEvent":
      return runCalendar(operation, input);
    case "listNotesFolders":
    case "listNotes":
    case "searchNotes":
    case "createNote":
    case "appendToNote":
    case "updateNote":
      return runNotes(operation, input);
    default:
      fail("Unknown operation: " + operation);
  }
}

function runReminders(operation, input) {
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
    case "updateReminder":
      return updateReminder(app, input);
    default:
      fail("Unknown operation: " + operation);
  }
}

function runCalendar(operation, input) {
  const app = calendarApp();
  app.includeStandardAdditions = true;

  switch (operation) {
    case "listCalendars":
      return app.calendars().map(serializeCalendar);
    case "listCalendarEvents":
      return allCalendarEvents(app, input);
    case "searchCalendarEvents": {
      const query = input.query.toLowerCase();
      return allCalendarEvents(app, input).filter((event) =>
        event.title.toLowerCase().includes(query) ||
        (event.notes || "").toLowerCase().includes(query) ||
        (event.location || "").toLowerCase().includes(query)
      );
    }
    case "createCalendarEvent":
      return createCalendarEvent(app, input);
    case "updateCalendarEvent":
      return updateCalendarEvent(app, input);
    default:
      fail("Unknown operation: " + operation);
  }
}

function runNotes(operation, input) {
  const app = notesApp();
  app.includeStandardAdditions = true;

  switch (operation) {
    case "listNotesFolders":
      return app.folders().map(serializeFolder);
    case "listNotes":
      return allNotes(app, input);
    case "searchNotes": {
      const query = input.query.toLowerCase();
      return allNotes(app, input).filter((note) =>
        note.title.toLowerCase().includes(query) ||
        note.body.toLowerCase().includes(query)
      );
    }
    case "createNote":
      return createNote(app, input);
    case "appendToNote":
      return appendToNote(app, input);
    case "updateNote":
      return updateNote(app, input);
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
