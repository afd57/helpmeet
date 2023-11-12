import { Webview, Uri } from "vscode";
import { Note } from "../types/Note";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";




function getHtmlContent(webview: Webview, extensionUri: Uri, note: Note): string {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);
  const nonce = getNonce();

  let helperForm = "";
  let dropdownDisabled = false;
  switch (note.helperType) {
    case "Run Command": {
      dropdownDisabled = true;
      helperForm = `
      <div id="run-command-div">
        <section class="formSection">
          <vscode-text-field id="command" value="${note.command}" placeholder="Enter Command">Command</vscode-text-field>
          <vscode-text-field id="path-command" value="${note.path}" placeholder="Enter Run Path">Path</vscode-text-field>
        </section>
      </div>`;
      break;
    }
    case "Change File": {
      dropdownDisabled = true;
      helperForm = `
      <div id="change-file-div">
        <section class="formSection">
          <vscode-text-field id="change-file-path" value="${note.path}" placeholder="File Path">Changed File
            Path</vscode-text-field>
          <vscode-text-area id="new-file-content" placeholder="Paste new file here" resize="vertical"
          rows=15>New File</vscode-text-area>
        </section>
      </div>`;
      break;
    }
    case "Run Script": {
      dropdownDisabled = true;
      helperForm = `
      <div id="run-script-div" hidden">
        <section class="formSection">
          <vscode-text-field id="command" value="${note.command}" placeholder="Enter Command">Run
            Command</vscode-text-field>
          <vscode-text-field id="script-name" value="${note.scriptFileName}" placeholder="Enter Script Name">Script
            Name</vscode-text-field>
          <vscode-text-field id="path-command" value="${note.path}" placeholder="Enter Run Path">Path</vscode-text-field>
          <vscode-text-area id="script-content" value="${note.scriptFile}" placeholder="Paste Script Here" resize="vertical"
            rows=15>Script Code</vscode-text-area>
        </section>
      </div>`;
      break;
    }
    default: {
      helperForm = `
      <div id="run-command-div" style="display:none;">
      <section class="formSection">
        <vscode-text-field id="command" value="${note.command}" placeholder="Enter Command">Command</vscode-text-field>
        <vscode-text-field id="path-command" value="${note.path}" placeholder="Enter Run Path">Path</vscode-text-field>
      </section>
    </div>
      <div id="change-file-div" style="display:none;">
        <section class="formSection">
          <vscode-text-field id="change-file-path" value="${note.path}" placeholder="Enter Command">Changed File
            Path</vscode-text-field>
          <vscode-text-area id="new-file-content" value="${note.newFile}" placeholder="Paste new file here" resize="vertical"
            rows=15>New File</vscode-text-area>
        </section>
      </div>
      <div id="run-script-div" hidden">
        <section class="formSection">
          <vscode-text-field id="command" value="${note.command}" placeholder="Enter Command">Run
            Command</vscode-text-field>
          <vscode-text-field id="script-name" value="${note.scriptFileName}" placeholder="Enter Script Name">Script
            Name</vscode-text-field>
          <vscode-text-field id="path-command" value="${note.path}" placeholder="Enter Run Path">Path</vscode-text-field>
          <vscode-text-area id="script-content" value="${note.scriptFile}" placeholder="Paste Script Here" resize="vertical"
            rows=15>Script Code</vscode-text-area>
        </section>
      </div>`;
      break;
    }
  }
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <link rel="stylesheet" href="${styleUri}">
    <title>${note.title}</title>
  </head>

  <body id="webview-body">
    <header>
      <h1>${note.title}</h1>
    </header>

    <div id="html-div">
    <form id=view-form>
      <section class="formSection">
        <section class="formSection">
          <vscode-dropdown id="dropdown" value="${note.helperType}" ${dropdownDisabled ? "disabled" : ""}>
            <vscode-option>Run Command</vscode-option>
            <vscode-option>Change File</vscode-option>
          </vscode-dropdown>
          <vscode-text-field id="title" value="${
            note.title
          }" placeholder="Enter helper title">Title</vscode-text-field>
        </section>
          ${helperForm}
        </form>
        <div id="row-rev" class="content">
          <vscode-button id="discard-button" appearance="secondary">Discard Changes</vscode-button>
          <vscode-button id="delete-button" appearance="secondary">Delete</vscode-button>
          <vscode-button id="submit-button">Save</vscode-button>
        </div>
      </section>
    </div>
    <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
  </body>

  </html>`;
}
/**
 * Defines and returns the HTML that should be rendered within a notepad note view (aka webview panel).
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param note An object representing a notepad note
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
export function getWebviewContent(webview: Webview, extensionUri: Uri, note: Note) {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);
  const nonce = getNonce();

  webview.onDidReceiveMessage((message) => {
    const command = message.command;
    switch (command) {
      case "requestNoteData":
        webview.postMessage({
          command: "receiveDataInWebview",
          payload: JSON.stringify(note),
        });
        break;
    }
  });

  return getHtmlContent(webview, extensionUri, note);

}
