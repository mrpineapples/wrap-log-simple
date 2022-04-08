"use strict";

import {
    commands,
    ExtensionContext,
    Position,
    Range,
    Selection,
    TextDocument,
    TextEditor,
    TextLine,
    window,
    workspace,
} from "vscode";
import { SupportedSettingTypes } from "./types";

const EXTENSION_NAME = "wrap-log-simple";
let currentEditor: TextEditor;

export function activate(context: ExtensionContext) {
    currentEditor = window.activeTextEditor;

    window.onDidChangeActiveTextEditor((editor) => (currentEditor = editor));

    context.subscriptions.push(
        commands.registerTextEditorCommand("wrap.log.name", (_editor, _edit) =>
            handle(Wrap.Down, true, "name")
        )
    );

    context.subscriptions.push(
        commands.registerTextEditorCommand(
            "wrap.log.nameValue",
            (_editor, _edit) => handle(Wrap.Down, true, "nameValue")
        )
    );
}

function handle(_target: Wrap, _prefix?: boolean, type?: string) {
    new Promise((resolve, reject) => {
        let sel = currentEditor.selection;
        let len = sel.end.character - sel.start.character;

        let selectionRange =
            len === 0
                ? currentEditor.document.getWordRangeAtPosition(sel.anchor)
                : new Range(sel.start, sel.end);

        if (!selectionRange) {
            reject("No selection made");
        } else {
            let doc = currentEditor.document;
            let lineNumber = selectionRange.start.line;
            let item = doc.getText(selectionRange);

            let idx = doc.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
            let ind = doc.lineAt(lineNumber).text.substring(0, idx);
            const funcName = getSetting("functionName");
            let wrapData: any = {
                txt: getSetting("functionName"),
                item: item,
                doc: doc,
                ran: selectionRange,
                idx: idx,
                ind: ind,
                line: lineNumber,
                sel: sel,
                lastLine: doc.lineCount - 1 == lineNumber,
            };

            const sc = getSetting("useSemicolon") ? ";" : "";
            const q = getSetting("useSingleQuotes") ? `'` : `"`;

            switch (type) {
                case "name": {
                    wrapData.txt = `${funcName}(${wrapData.item})${sc}`;
                    break;
                }
                case "nameValue": {
                    wrapData.txt = `${funcName}(${q}${wrapData.item}${q}, ${wrapData.item})${sc}`;
                    break;
                }
                default: {
                    wrapData.txt = `${funcName}(${q}${wrapData.item}${q})${sc}`;
                    break;
                }
            }
            resolve(wrapData);
        }
    })
        .then((wrap: WrapData) => {
            let nxtLine: TextLine;
            let nxtLineInd: string;

            if (!wrap.lastLine) {
                nxtLine = wrap.doc.lineAt(wrap.line + 1);
                nxtLineInd = nxtLine.text.substring(
                    0,
                    nxtLine.firstNonWhitespaceCharacterIndex
                );
            } else {
                nxtLineInd = "";
            }
            currentEditor
                .edit((e) => {
                    e.insert(
                        new Position(
                            wrap.line,
                            wrap.doc.lineAt(wrap.line).range.end.character
                        ),
                        "\n".concat(
                            nxtLineInd > wrap.ind ? nxtLineInd : wrap.ind,
                            wrap.txt
                        )
                    );
                })
                .then(() => {
                    currentEditor.selection = wrap.sel;
                });
        })
        .catch((message) => {
            console.error(message);
        });
}

const getSetting = (setting: string): SupportedSettingTypes => {
    const settingId = `${EXTENSION_NAME}.${setting}`;
    const langKey = `[${currentEditor.document.languageId}]`;
    const config = workspace.getConfiguration("", currentEditor.document);
    const langWorkspaceValue =
        config.inspect(langKey).workspaceValue?.[settingId];
    const langGlobalValue = config.inspect(langKey).globalValue?.[settingId];
    const defaultValue = workspace.getConfiguration(EXTENSION_NAME)[setting];

    return langWorkspaceValue ?? langGlobalValue ?? defaultValue;
};

interface WrapData {
    doc: TextDocument;
    idx: number;
    ind: string;
    item: string;
    lastLine: boolean;
    line: number;
    ran: Range;
    sel: Selection;
    txt: string;
}

enum Wrap {
    Down,
    Inline,
    Up,
}

export function deactivate() {
    return undefined;
}
