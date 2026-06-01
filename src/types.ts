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

export type ReminderRunner = <T>(operation: string, payload?: unknown) => Promise<T>;
