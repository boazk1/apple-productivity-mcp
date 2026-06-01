import type {
  CalendarEvent,
  CalendarItem,
  CreateCalendarEventOptions,
  ListCalendarEventsOptions,
  ReminderRunner,
  SearchCalendarEventsOptions
} from "./types.js";

export class CalendarClient {
  constructor(private readonly runner: ReminderRunner) {}

  listCalendars(): Promise<CalendarItem[]> {
    return this.runner<CalendarItem[]>("listCalendars");
  }

  listEvents(options: ListCalendarEventsOptions = {}): Promise<CalendarEvent[]> {
    return this.runner<CalendarEvent[]>("listCalendarEvents", withDefaultRange(options));
  }

  getTodayEvents(options: Omit<ListCalendarEventsOptions, "startDate" | "endDate"> = {}): Promise<CalendarEvent[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return this.listEvents({
      ...options,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
  }

  getUpcomingEvents(options: ListCalendarEventsOptions = {}): Promise<CalendarEvent[]> {
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.listEvents({
      startDate: now.toISOString(),
      endDate: defaultEnd.toISOString(),
      ...options
    });
  }

  searchEvents(options: SearchCalendarEventsOptions): Promise<CalendarEvent[]> {
    return this.runner<CalendarEvent[]>("searchCalendarEvents", withDefaultRange(options));
  }

  createEvent(options: CreateCalendarEventOptions): Promise<CalendarEvent> {
    return this.runner<CalendarEvent>("createCalendarEvent", options);
  }
}

function withDefaultRange<T extends ListCalendarEventsOptions>(options: T): T & Required<Pick<ListCalendarEventsOptions, "startDate" | "endDate">> {
  const start = options.startDate ? new Date(options.startDate) : new Date();
  const end = options.endDate ? new Date(options.endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    ...options,
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}
