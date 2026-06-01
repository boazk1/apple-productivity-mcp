import type {
  CompleteReminderOptions,
  CreateReminderOptions,
  ListRemindersOptions,
  ReminderItem,
  ReminderList,
  ReminderRunner,
  SearchRemindersOptions
} from "./types.js";

export class RemindersClient {
  constructor(private readonly runner: ReminderRunner) {}

  listReminderLists(): Promise<ReminderList[]> {
    return this.runner<ReminderList[]>("listReminderLists");
  }

  listReminders(options: ListRemindersOptions = {}): Promise<ReminderItem[]> {
    return this.runner<ReminderItem[]>("listReminders", {
      dateFilter: "all",
      includeCompleted: false,
      ...options
    });
  }

  getTodayReminders(options: Omit<ListRemindersOptions, "dateFilter"> = {}): Promise<ReminderItem[]> {
    return this.listReminders({
      ...options,
      dateFilter: "today"
    });
  }

  getOverdueReminders(options: Omit<ListRemindersOptions, "dateFilter"> = {}): Promise<ReminderItem[]> {
    return this.listReminders({
      ...options,
      dateFilter: "overdue"
    });
  }

  searchReminders(options: SearchRemindersOptions): Promise<ReminderItem[]> {
    return this.runner<ReminderItem[]>("searchReminders", {
      includeCompleted: false,
      ...options
    });
  }

  createReminder(options: CreateReminderOptions): Promise<ReminderItem> {
    return this.runner<ReminderItem>("createReminder", options);
  }

  completeReminder(options: CompleteReminderOptions): Promise<ReminderItem> {
    return this.runner<ReminderItem>("completeReminder", options);
  }
}
