export type ReminderItem = {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  dueDate: string | null;
  listName: string;
};

export type ReminderList = {
  id: string;
  name: string;
};

export type ReminderDateFilter = "all" | "today" | "overdue";

export type ListRemindersOptions = {
  listName?: string;
  includeCompleted?: boolean;
  dateFilter?: ReminderDateFilter;
};

export type SearchRemindersOptions = {
  query: string;
  listName?: string;
  includeCompleted?: boolean;
};

export type CreateReminderOptions = {
  title: string;
  notes?: string;
  listName?: string;
  dueDate?: string;
};

export type CompleteReminderOptions = {
  id?: string;
  title?: string;
  listName?: string;
};

export type UpdateReminderOptions = {
  id: string;
  title?: string;
  notes?: string;
  listName?: string;
  dueDate?: string | null;
};

export type CalendarItem = {
  id: string;
  name: string;
  color: string | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  notes: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  calendarName: string;
};

export type ListCalendarEventsOptions = {
  calendarName?: string;
  startDate?: string;
  endDate?: string;
};

export type SearchCalendarEventsOptions = ListCalendarEventsOptions & {
  query: string;
};

export type CreateCalendarEventOptions = {
  title: string;
  calendarName?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  location?: string;
  allDay?: boolean;
};

export type UpdateCalendarEventOptions = {
  id: string;
  calendarName?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  location?: string;
  allDay?: boolean;
};

export type NotesFolder = {
  id: string;
  name: string;
};

export type NoteItem = {
  id: string;
  title: string;
  body: string;
  folderName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ListNotesOptions = {
  folderName?: string;
};

export type SearchNotesOptions = ListNotesOptions & {
  query: string;
};

export type CreateNoteOptions = {
  title: string;
  body?: string;
  folderName?: string;
};

export type AppendNoteOptions = {
  id?: string;
  title?: string;
  folderName?: string;
  text: string;
};

export type UpdateNoteOptions = {
  id: string;
  title?: string;
  body?: string;
  folderName?: string;
};

export type ReminderRunner = <T>(operation: string, payload?: unknown) => Promise<T>;
