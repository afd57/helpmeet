import { commands, ExtensionContext, WebviewPanel, window, ViewColumn, Uri, workspace, WorkspaceEdit } from "vscode";
import { v4 as uuidv4 } from "uuid";
import { NotepadDataProvider } from "./providers/NotepadDataProvider";
import { getWebviewContent } from "./ui/getWebviewContent";
import { Note, Helper } from "./types/Note";
import * as fs from 'fs';
import * as path from 'path';



export function activate(context: ExtensionContext) {
  let notes: Note[] = [];

  let panel: WebviewPanel | undefined = undefined;
  const globalStorageUri = context.globalStorageUri;
  const globalStoragePath = globalStorageUri.fsPath;
  const filePath = `${globalStoragePath}/my-extension-data.txt`;

  if (!fs.existsSync(globalStoragePath)) {
    fs.mkdirSync(globalStoragePath);
  }

  // Check if the data file exists
  if (fs.existsSync(filePath)) {
    // Read the data file
    const data = fs.readFileSync(filePath, "utf8");
    window.showInformationMessage(`The Vavilov Extension Data is stored locally at the specified ${filePath}.`);
    try {
      notes = JSON.parse(data);
    } catch (error) {
      // create empty file
      fs.writeFileSync(filePath, "", "utf8");
    }
  } else {
    // Write some data to the file
    fs.writeFileSync(filePath, "", "utf8");
    window.showInformationMessage("My extension data file created.");
  }

  const notepadDataProvider = new NotepadDataProvider(notes);

  // Create a tree view to contain the list of notepad notes
  const treeView = window.createTreeView("notepad.notesList", {
    treeDataProvider: notepadDataProvider,
    showCollapseAll: false,
  });

  // Command to render a webview-based note view
  const openNote = commands.registerCommand("notepad.showNoteDetailView", () => {
    const selectedTreeViewItem = treeView.selection[0];
    const matchingNote = notes.find((note) => note.id === selectedTreeViewItem.id);
    let newTab = false;
    if (!matchingNote) {
      window.showErrorMessage("No matching note found");
      return;
    }

    // If no panel is open, create a new one and update the HTML
    if (!panel) {
      newTab = true;
      panel = window.createWebviewPanel("noteDetailView", matchingNote.title, ViewColumn.One, {
        // Enable JavaScript in the webview
        enableScripts: true,
        // Restrict the webview to only load resources from the `out` directory
        localResourceRoots: [Uri.joinPath(context.extensionUri, "out")],
      });
    }

    // If a panel is open, update the HTML with the selected item's content
    panel.title = matchingNote.title;
    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, matchingNote);

    // If a panel is open and receives an update message, update the notes array and the panel title/html
    panel.webview.onDidReceiveMessage((message) => {
      const command = message.command;
      const note = message.note;
      switch (command) {
        case "updateNote":
          const updatedNoteId = note.id;
          const copyOfNotesArray = [...notes];
          const matchingNoteIndex = copyOfNotesArray.findIndex((note) => note.id === updatedNoteId);
          copyOfNotesArray[matchingNoteIndex] = note;
          notes = copyOfNotesArray;
          console.log(notes);
          fs.writeFileSync(filePath, JSON.stringify(notes), "utf8");
          notepadDataProvider.refresh(notes);
          panel
            ? ((panel.title = note.title),
              (panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, note)))
            : null;
          break;
        case "deleteNote":
          deleteNoteCallBack(note);
          break;
      }
    });

    panel.onDidDispose(
      () => {
        // When the panel is closed, cancel any future updates to the webview content
        panel = undefined;
      },
      null,
      context.subscriptions
    );
  });

  // Command to create a new note
  const createNote = commands.registerCommand("notepad.createNote", () => {
    const id = uuidv4();

    const newNote: Note = {
      id: id,
      title: "New Helper",
      helperType: "",
      path: "",
      command: "",
      newFile: "",
      scriptFile: "",
      scriptFileName: "",
    };

    notes.push(newNote);
    notepadDataProvider.refresh(notes);
  });

  
  const runCommand = commands.registerCommand("notepad.run", (node: Note) => {
    const selectedTreeViewItem = node;
    const selectedHelperIndex = notes.findIndex((note) => note.id === selectedTreeViewItem.id);
    const helperData = notes[selectedHelperIndex];

    switch (helperData.helperType) {
      case "Change File":
        console.log("Change File Command");
        if (helperData.newFile && workspace.workspaceFolders?.length) {
          const wsPath = workspace.workspaceFolders[0].uri.fsPath;
          const filePath = Uri.file(path.join(wsPath, helperData.path));
          window.showInformationMessage(`${filePath.toString()} is changed.`);
          fs.writeFileSync(filePath.fsPath, helperData.newFile);
        } else {
          window.showErrorMessage(`Please open a workspaced to use extension.`);
        }
        break;
      case "Run Command":
        if (workspace.workspaceFolders?.length) {
          const wsPath = workspace.workspaceFolders[0].uri.fsPath;
          const cwd = Uri.file(path.join(wsPath, helperData.path));
          let t = window.createTerminal({ cwd: cwd });
          t.show();
          t.sendText(`${helperData.command}`); // new line
        } else {
          window.showErrorMessage(`Please open a workspaced to use extension.`);
        }
        break;
      case "Run Script":
        console.log("Run Script");
        break;
    }
  });

  // Command to delete a given note
  function deleteNoteCallBack(node: Note) {
    const selectedTreeViewItem = node;
    const selectedNoteIndex = notes.findIndex((note) => note.id === selectedTreeViewItem.id);
    notes.splice(selectedNoteIndex, 1);
    fs.writeFileSync(filePath, JSON.stringify(notes), "utf8");
    notepadDataProvider.refresh(notes);

    // Close the panel if it's open
    panel?.dispose();
  }
  const deleteNote = commands.registerCommand("notepad.deleteNote", deleteNoteCallBack);

  // Add commands to the extension context
  context.subscriptions.push(openNote);
  context.subscriptions.push(runCommand);
  context.subscriptions.push(createNote);
  context.subscriptions.push(deleteNote);
}
