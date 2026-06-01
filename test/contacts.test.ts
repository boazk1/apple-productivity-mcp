import { describe, expect, it } from "vitest";

import { ContactsClient } from "../src/contacts.js";
import type { ContactItem, ReminderRunner } from "../src/types.js";

const contact: ContactItem = {
  id: "contact-1",
  name: "Ada Lovelace",
  organization: "Analytical Engines Ltd",
  phones: ["+15550101010"],
  emails: ["ada@example.com"]
};

describe("ContactsClient", () => {
  it("searches contacts with a default limit", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [contact];
    };

    const client = new ContactsClient(runner);
    await expect(client.searchContacts({ query: "ada" })).resolves.toEqual([contact]);

    expect(calls).toEqual([
      [
        "searchContacts",
        {
          limit: 10,
          query: "ada"
        }
      ]
    ]);
  });

  it("gets contacts by id", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return contact;
    };

    const client = new ContactsClient(runner);
    await expect(client.getContact({ id: "contact-1" })).resolves.toEqual(contact);

    expect(calls).toEqual([["getContact", { id: "contact-1" }]]);
  });
});
