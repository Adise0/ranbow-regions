import * as vscode from "vscode";

// TODO: Make auto-folding optional

interface Tag {
  range: vscode.Range;
  text: string;
  scope: number;
  type: "start" | "end";
  color?: string;
  index: number;
}

const openedDocs = new Set();

let decorationTypes: { [color: string]: vscode.TextEditorDecorationType } = {};

export function activate(context: vscode.ExtensionContext) {
  console.log("Color Regions extension activated cool!");

  const colorRegions = (document: vscode.TextDocument) => {
    // console.log("COLORING REGIONS");
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) {
      return;
    }

    const text = document.getText();
    const regionRegex = /\/\/\s*#region|\/\/\s*#endregion/g;
    const colors = [
      "#F28C28",
      "#4682B4",
      "#D2691E",
      "#8A2BE2",
      "#E9967A",
      "#3CB371",
      "#FFD700",
      "#00f0ff",
    ];
    let match;

    let currentScope = 0;
    const allTags: Tag[] = [];

    while ((match = regionRegex.exec(text)) !== null) {
      const matchPosition = document.positionAt(match.index);
      const line = document.lineAt(matchPosition.line);

      const lineRange = new vscode.Range(line.range.start, line.range.end);
      const type = line.text.includes("#region") ? "start" : "end";

      if (type === "start") {
        currentScope++;
      }

      const index = allTags.filter(
        (allTag) => allTag.scope === currentScope && allTag.type === type
      ).length;

      const tag: Tag = {
        range: lineRange,
        text: line.text,
        scope: currentScope,
        index: index,
        type,
      };

      if (type === "end") {
        currentScope--;
      }

      allTags.push(tag);
    }

    allTags.sort((a, b) => {
      if (a.type === "start" && b.type === "end") {
        return -1;
      }
      if (a.type === "end" && b.type === "start") {
        return 1;
      }
      return 0;
    });

    let currentColor = 0;
    const colorDecorations: { [color: string]: vscode.DecorationOptions[] } =
      {};

    allTags.forEach((tag) => {
      if (tag.type === "start") {
        const endTag = allTags.find(
          (endTag) =>
            endTag.type === "end" &&
            endTag.scope === tag.scope &&
            endTag.index === tag.index
        );

        const color = endTag ? colors[currentColor] : "#ff0000";

        // Create or get the decoration type for the current color
        if (!decorationTypes[color]) {
          decorationTypes[color] = vscode.window.createTextEditorDecorationType(
            {
              color: color,
            }
          );
        }

        // Initialize color decorations array if not already
        if (!colorDecorations[color]) {
          colorDecorations[color] = [];
        }

        // Apply the decoration to the start tag
        colorDecorations[color].push({
          range: tag.range,
        });

        if (endTag) {
          // Apply the decoration to the end tag with hover message
          colorDecorations[color].push({
            range: endTag.range,
            renderOptions: {
              after: {
                contentText: tag.text
                  .replace("region", "")
                  .replace("#", "")
                  .replace("//", ""),
              },
            },
          });
        }

        currentColor++;
        if (currentColor === colors.length) {
          currentColor = 0;
        }
      }
    });

    // Clear previous decorations
    for (const color in decorationTypes) {
      editor.setDecorations(decorationTypes[color], []);
    }

    // Apply current decorations
    for (const color in colorDecorations) {
      editor.setDecorations(decorationTypes[color], colorDecorations[color]);
    }
  };

  vscode.workspace.onDidChangeTextDocument((event) => {
    console.log("ON CHANGE TEXT");
    colorRegions(event.document);
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    console.log("ON CHANGE ACTIVE");
    if (editor) {
      colorRegions(editor.document);
    }
  });

  // vscode.workspace.onDidOpenTextDocument((document) => {
  //   if (document.fileName.includes(".git")) {
  //     return;
  //   }
  //   vscode.commands.executeCommand("editor.foldAllMarkerRegions");
  // });
  vscode.workspace.onDidOpenTextDocument((document) => {
    // Add the document URI to the set without folding immediately
    if (!document.fileName.includes(".git")) {
      openedDocs.add(document.uri.toString());
    }
    console.log(document.fileName);
  });
  vscode.window.onDidChangeVisibleTextEditors((editors) => {
    editors.forEach((editor) => {
      const document = editor.document;
      const docUri = document.uri.toString();

      // Fold only if the document is newly opened and visible in the editor for the first time
      if (openedDocs.has(docUri)) {
        openedDocs.delete(docUri); // Remove from set so it doesn't fold again

        if (document.lineCount >= 75) {
          vscode.commands.executeCommand("editor.foldAllMarkerRegions");
        }
      }
    });
  });

  if (vscode.window.activeTextEditor) {
    colorRegions(vscode.window.activeTextEditor.document);
  }
}

export function deactivate() {
  // Clean up decorations
  for (const color in decorationTypes) {
    decorationTypes[color].dispose();
  }
}
