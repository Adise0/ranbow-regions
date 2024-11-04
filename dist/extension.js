/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const openedDocs = new Set();
let decorationTypes = {};
function activate(context) {
    console.log("Color Regions extension activated cool!");
    const colorRegions = (document) => {
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
        const allTags = [];
        while ((match = regionRegex.exec(text)) !== null) {
            const matchPosition = document.positionAt(match.index);
            const line = document.lineAt(matchPosition.line);
            const lineRange = new vscode.Range(line.range.start, line.range.end);
            const type = line.text.includes("#region") ? "start" : "end";
            if (type === "start") {
                currentScope++;
            }
            const index = allTags.filter((allTag) => allTag.scope === currentScope && allTag.type === type).length;
            const tag = {
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
        const colorDecorations = {};
        allTags.forEach((tag) => {
            if (tag.type === "start") {
                const endTag = allTags.find((endTag) => endTag.type === "end" &&
                    endTag.scope === tag.scope &&
                    endTag.index === tag.index);
                const color = endTag ? colors[currentColor] : "#ff0000";
                // Create or get the decoration type for the current color
                if (!decorationTypes[color]) {
                    decorationTypes[color] = vscode.window.createTextEditorDecorationType({
                        color: color,
                    });
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
function deactivate() {
    // Clean up decorations
    for (const color in decorationTypes) {
        decorationTypes[color].dispose();
    }
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map