import { describe, expect, it } from "vitest";

import { NotesClient } from "../src/notes.js";
import type { NoteItem, ReminderRunner } from "../src/types.js";

const note: NoteItem = {
  id: "notes-note-1",
  title: "Launch plan",
  body: "Draft the project launch plan.",
  folderName: "Projects",
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-06-01T08:30:00.000Z"
};

describe("NotesClient", () => {
  it("lists notes folders", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [{ id: "folder-1", name: "Projects" }];
    };

    const client = new NotesClient(runner);
    await expect(client.listFolders()).resolves.toEqual([{ id: "folder-1", name: "Projects" }]);
    expect(calls).toEqual([["listNotesFolders", undefined]]);
  });

  it("lists and searches notes through the runner", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return [note];
    };

    const client = new NotesClient(runner);
    await client.listNotes({ folderName: "Projects" });
    await client.searchNotes({ query: "launch", folderName: "Projects" });

    expect(calls).toEqual([
      ["listNotes", { folderName: "Projects" }],
      ["searchNotes", { query: "launch", folderName: "Projects" }]
    ]);
  });

  it("creates and appends notes through the runner", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return note;
    };

    const client = new NotesClient(runner);
    await client.createNote({
      title: "Launch plan",
      body: "Draft the project launch plan.",
      folderName: "Projects"
    });
    await client.appendToNote({
      id: "notes-note-1",
      text: "Add launch checklist."
    });

    expect(calls).toEqual([
      [
        "createNote",
        {
          title: "Launch plan",
          body: "Draft the project launch plan.",
          folderName: "Projects"
        }
      ],
      [
        "appendToNote",
        {
          id: "notes-note-1",
          text: "Add launch checklist."
        }
      ]
    ]);
  });

  it("updates notes through the runner", async () => {
    const calls: Array<[string, unknown]> = [];
    const runner: ReminderRunner = async (operation, payload) => {
      calls.push([operation, payload]);
      return note;
    };

    const client = new NotesClient(runner);
    await client.updateNote({
      id: "notes-note-1",
      title: "Updated launch plan",
      body: "Updated body."
    });

    expect(calls).toEqual([
      [
        "updateNote",
        {
          id: "notes-note-1",
          title: "Updated launch plan",
          body: "Updated body."
        }
      ]
    ]);
  });
});
