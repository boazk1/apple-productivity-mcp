import type { ContactItem, GetContactOptions, ReminderRunner, SearchContactsOptions } from "./types.js";

export class ContactsClient {
  constructor(private readonly runner: ReminderRunner) {}

  searchContacts(options: SearchContactsOptions): Promise<ContactItem[]> {
    return this.runner<ContactItem[]>("searchContacts", {
      limit: 10,
      ...options
    });
  }

  getContact(options: GetContactOptions): Promise<ContactItem> {
    return this.runner<ContactItem>("getContact", options);
  }
}
