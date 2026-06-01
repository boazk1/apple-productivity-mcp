import type {
  AppendNoteOptions,
  CreateNoteOptions,
  ListNotesOptions,
  NoteItem,
  NotesFolder,
  ReminderRunner,
  SearchNotesOptions
} from "./types.js";

export class NotesClient {
  constructor(private readonly runner: ReminderRunner) {}

  listFolders(): Promise<NotesFolder[]> {
    return this.runner<NotesFolder[]>("listNotesFolders");
  }

  listNotes(options: ListNotesOptions = {}): Promise<NoteItem[]> {
    return this.runner<NoteItem[]>("listNotes", options);
  }

  searchNotes(options: SearchNotesOptions): Promise<NoteItem[]> {
    return this.runner<NoteItem[]>("searchNotes", options);
  }

  createNote(options: CreateNoteOptions): Promise<NoteItem> {
    return this.runner<NoteItem>("createNote", options);
  }

  appendToNote(options: AppendNoteOptions): Promise<NoteItem> {
    return this.runner<NoteItem>("appendToNote", options);
  }
}
