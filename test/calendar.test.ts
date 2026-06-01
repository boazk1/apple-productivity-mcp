import { describe, expect, it, vi } from "vitest";

import { CalendarClient } from "../src/calendar.js";
import type { CalendarEvent, ReminderRunner } from "../src/types.js";

const event: CalendarEvent = {
  id: "calendar-event-1",
  title: "Planning",
  notes: null,
  location: null,
  startDate: "2026-06-01T08:00:00.000Z",
  endDate: "2026-06-01T08:30:00.000Z",
  allDay: false,
  calendarName: "Work"
};

describe("CalendarClient", () => {
  it("passes default event ranges to the runner", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T10:00:00.000Z"));

    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [event];
    };

    const client = new CalendarClient(runner);
    await expect(client.listEvents({ calendarName: "Work" })).resolves.toEqual([event]);

    expect(calls).toEqual([
      [
        "listCalendarEvents",
        {
          calendarName: "Work",
          startDate: "2026-06-01T10:00:00.000Z",
          endDate: "2026-06-08T10:00:00.000Z"
        }
      ]
    ]);

    vi.useRealTimers();
  });

  it("builds today and upcoming event ranges", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T10:00:00.000Z"));

    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [event];
    };

    const client = new CalendarClient(runner);
    await client.getTodayEvents({ calendarName: "Home" });
    await client.getUpcomingEvents();

    const todayStart = new Date(2026, 5, 1).toISOString();
    const tomorrowStart = new Date(2026, 5, 2).toISOString();

    expect(calls).toEqual([
      [
        "listCalendarEvents",
        {
          calendarName: "Home",
          startDate: todayStart,
          endDate: tomorrowStart
        }
      ],
      [
        "listCalendarEvents",
        {
          startDate: "2026-06-01T10:00:00.000Z",
          endDate: "2026-06-08T10:00:00.000Z"
        }
      ]
    ]);

    vi.useRealTimers();
  });

  it("creates events through the calendar operation", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return event;
    };

    const client = new CalendarClient(runner);
    await client.createEvent({
      title: "Planning",
      calendarName: "Work",
      startDate: "2026-06-01T10:00:00+02:00",
      endDate: "2026-06-01T10:30:00+02:00"
    });

    expect(calls).toEqual([
      [
        "createCalendarEvent",
        {
          title: "Planning",
          calendarName: "Work",
          startDate: "2026-06-01T10:00:00+02:00",
          endDate: "2026-06-01T10:30:00+02:00"
        }
      ]
    ]);
  });

  it("updates events through the calendar operation", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return event;
    };

    const client = new CalendarClient(runner);
    await client.updateEvent({
      id: "calendar-event-1",
      title: "Planning review",
      location: "Office"
    });

    expect(calls).toEqual([
      [
        "updateCalendarEvent",
        {
          id: "calendar-event-1",
          title: "Planning review",
          location: "Office"
        }
      ]
    ]);
  });
});
