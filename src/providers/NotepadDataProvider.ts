import { Event, EventEmitter, ProviderResult, ThemeIcon, TreeDataProvider, TreeItem } from "vscode";
import { Note } from "../types/Note";

// A custom type to keep the code below more tidy
type TreeDataOnChangeEvent = NotepadNote | undefined | null | void;

/**
 * An implementation of the TreeDataProvider interface.
 *
 * This class is responsible for managing the tree data that the VS Code
 * TreeView API needs to render a custom tree view.
 *
 * Learn more about Tree Data Providers here:
 * https://code.visualstudio.com/api/extension-guides/tree-view#tree-data-provider
 */
export class NotepadDataProvider implements TreeDataProvider<NotepadNote> {
  private _onDidChangeTreeData = new EventEmitter<TreeDataOnChangeEvent>();
  readonly onDidChangeTreeData: Event<TreeDataOnChangeEvent> = this._onDidChangeTreeData.event;

  data: NotepadNote[];

  constructor(notesData: Note[]) {
    this.data = notesData.map((note) => new NotepadNote(note.id, note.title, note.helperType));
  }

  refresh(notesData: Note[]): void {
    this._onDidChangeTreeData.fire();
    this.data = notesData.map((note) => new NotepadNote(note.id, note.title, note.helperType));
  }

  getTreeItem(element: NotepadNote): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(element?: NotepadNote | undefined): ProviderResult<NotepadNote[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  getParent() {
    return null;
  }
}


let typeMap = new Map<string, string>([
  ["Run Command","console"],
  ["Change File","file-code"],
  ["Run Script","test-view-icon"]
]);


class NotepadNote extends TreeItem {
  children?: NotepadNote[];

  constructor(noteId: string, title: string, helperType: string) {
    super(title);
    this.id = noteId;
    this.iconPath = new ThemeIcon(typeMap.get(helperType) ?? "file");
    this.command = {
      title: "Open Helper",
      command: "notepad.showNoteDetailView",
    };
  }
}
