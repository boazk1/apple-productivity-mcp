import { describe, expect, it } from "vitest";

import { RemindersClient } from "../src/reminders.js";
import type { ReminderItem, ReminderRunner } from "../src/types.js";

const reminder: ReminderItem = {
  id: "x-apple-reminder://123",
  title: "Pay rent",
  notes: null,
  completed: false,
  dueDate: "2026-06-01T08:00:00.000Z",
  listName: "Personal"
};

describe("RemindersClient", () => {
  it("passes default list options to the runner", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [reminder];
    };

    const client = new RemindersClient(runner);
    await expect(client.listReminders()).resolves.toEqual([reminder]);

    expect(calls).toEqual([
      [
        "listReminders",
        {
          dateFilter: "all",
          includeCompleted: false
        }
      ]
    ]);
  });

  it("builds today and overdue filters", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [reminder];
    };

    const client = new RemindersClient(runner);
    await client.getTodayReminders({ listName: "Work" });
    await client.getOverdueReminders();

    expect(calls).toEqual([
      [
        "listReminders",
        {
          dateFilter: "today",
          includeCompleted: false,
          listName: "Work"
        }
      ],
      [
        "listReminders",
        {
          dateFilter: "overdue",
          includeCompleted: false
        }
      ]
    ]);
  });

  it("searches incomplete reminders by default", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [reminder];
    };

    const client = new RemindersClient(runner);
    await client.searchReminders({ query: "rent" });

    expect(calls).toEqual([
      [
        "searchReminders",
        {
          includeCompleted: false,
          query: "rent"
        }
      ]
    ]);
  });
});
