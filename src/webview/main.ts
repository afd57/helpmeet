import {
  provideVSCodeDesignSystem,
  Button,
  Tag,
  TextArea,
  TextField,
  vsCodeButton,
  vsCodeTag,
  vsCodeTextArea,
  vsCodeTextField,
  vsCodeDropdown,
  vsCodeOption,
  vsCodeRadio,
  vsCodeRadioGroup,
  Dropdown,
  Option,
} from "@vscode/webview-ui-toolkit";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTag(),
  vsCodeTextArea(),
  vsCodeTextField(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodeRadio(),
  vsCodeRadioGroup(),
);

// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener("load", main);

const typeMap = {
  "Run Command": "run-command-div",
  "Change File": "change-file-div",
  "Run Script": "run-script-div",
};

function main() {
  setVSCodeMessageListener();
  const tmpData = window.localStorage.getItem(`vavilov`);
  vscode.postMessage({ command: "requestNoteData", tmpData: tmpData });

  const dropdown = document.getElementById("dropdown") as Dropdown;
  changeType(dropdown);

  // To get improved type annotations/IntelliSense the associated class for
  // a given toolkit component can be imported and used to type cast a reference
  // to the element (i.e. the `as Button` syntax)
  const saveButton = document.getElementById("submit-button") as Button;
  const deleteButton = document.getElementById("delete-button") as Button;
  const discardButton = document.getElementById("discard-button") as Button;
  const form = document.querySelector('form') as any;

  form.addEventListener("input", (e:any) => {
    saveNote(true);
  });

  saveButton.addEventListener("click", () => {
    saveNote(false);
  });

  deleteButton.addEventListener("click", () => {
    deleteNote();
  });

  discardButton.addEventListener("click", () => {
    window.localStorage.removeItem(`vavilov_${openedNote.id}`);
    recoveredTmpData();
  });

  dropdown.addEventListener("change", () => {
    changeType(dropdown);
  });
}

// Stores the currently opened note info so we know the ID when we update it on save
let openedNote;

function setVSCodeMessageListener() {
  const newFileContent = document.getElementById("new-file-content") as TextArea;
  
  window.addEventListener("message", (event) => {
    const command = event.data.command;
    const noteData = JSON.parse(event.data.payload);
    if(newFileContent){
      newFileContent.value = noteData.newFile ?? '';
    }

    switch (command) {
      case "receiveDataInWebview":
        openedNote = noteData;
        recoveredTmpData();
        break;
    }
  });
}

function changeType(dropdown:Dropdown) {
  const selectedValue = dropdown.value;
  console.log(selectedValue);
  const noteType = document.getElementById(typeMap[selectedValue]) as HTMLDivElement;

  const hiddenSections = Object.keys(typeMap).filter((val) => val !== selectedValue);
  hiddenSections.map((value) => {
    const hiddenSection = document.getElementById(typeMap[value]) as HTMLDivElement;
    hiddenSection !== null ? (hiddenSection.style.display = "none") : "";
  });
  noteType.style.display = "block";
}

function saveNote(localStorage: boolean) {
  const titleInput = document.getElementById("title") as TextField;
  const command = document.getElementById("command") as TextField;
  const changeFilePath = document.getElementById("change-file-path") as TextField;
  const newFileContent = document.getElementById("new-file-content") as TextArea;
  const commandPath = document.getElementById("path-command") as TextArea;
  const noteType = document.getElementById("dropdown") as Dropdown;

  const titleInputValue = titleInput?.value ?? "";
  const commandValue = command?.value ?? "";
  const commandPathValue = commandPath?.value ?? "";
  const changeFilePathValue = changeFilePath?.value ?? "";
  const newFileContentValue = newFileContent?.value ?? "";

  const noteTypeValue = noteType?.value;
  console.log(noteTypeValue);
  

  const noteToUpdate = {
    id: openedNote.id,
    title: titleInputValue,
    helperType: noteTypeValue,
    path: commandPathValue === "" ? changeFilePathValue: commandPathValue,
    command: commandValue,
    newFile: newFileContentValue,
    scriptFile: '',
    
  };

  if(!localStorage){
    vscode.postMessage({ command: "updateNote", note: noteToUpdate });
  } else {
    window.localStorage.setItem(`vavilov_${openedNote.id}`, JSON.stringify(noteToUpdate));
  }
}

function deleteNote() {
  const noteToUpdate = {
    id: openedNote.id,
  };

  vscode.postMessage({ command: "deleteNote", note: noteToUpdate });
}

function recoveredTmpData(){
  const titleInput = document.getElementById("title") as TextField;
  const command = document.getElementById("command") as TextField;
  const changeFilePath = document.getElementById("change-file-path") as TextField;
  const newFileContent = document.getElementById("new-file-content") as TextArea;
  const commandPath = document.getElementById("path-command") as TextArea;
  const noteType = document.getElementById("dropdown") as Dropdown;

  const tmpData = window.localStorage.getItem(`vavilov_${openedNote.id}`);
  const tmpDataJson = tmpData ? JSON.parse(tmpData) : openedNote;
  const recoveredData = tmpDataJson;
  
  if (recoveredData) {
    document.title = document.title + "*";
    const pathValue = recoveredData?.path as string;
    titleInput ? titleInput.value = recoveredData?.title ?? '' : '';
    command ? command.value = recoveredData?.command ?? '' : '';
    changeFilePath ? changeFilePath.value = pathValue : '';
    commandPath ? commandPath.value = pathValue : '';
    newFileContent ? newFileContent.value = recoveredData?.newFile ?? '' : '';
    noteType ? noteType.value = recoveredData?.helperType ?? '': '';
  }
}
