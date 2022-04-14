"use strict";

import {
    commands,
    ExtensionContext,
    Position,
    Range,
    TextEditor,
    TextLine,
    window,
    workspace,
} from "vscode";
import { Command, WrapData } from "./types";

const EXTENSION_NAME = "wrap-log-simple";
let currentEditor: TextEditor;

export const activate = (context: ExtensionContext) => {
    currentEditor = window.activeTextEditor as TextEditor;

    window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            currentEditor = editor;
        }
    });

    context.subscriptions.push(
        commands.registerTextEditorCommand("wrap.log.name", (_editor, _edit) =>
            handle(Command.Name)
        ),
        commands.registerTextEditorCommand(
            "wrap.log.nameValue",
            (_editor, _edit) => handle(Command.NameValue)
        )
    );
};

const executeCommand = (type?: string): Promise<WrapData> => {
    return new Promise<WrapData>((resolve, reject) => {
        const sel = currentEditor.selection;
        const len = sel.end.character - sel.start.character;

        const selectionRange =
            len === 0
                ? currentEditor.document.getWordRangeAtPosition(sel.anchor)
                : new Range(sel.start, sel.end);

        if (!selectionRange) {
            reject("No selection made");
        } else {
            const doc = currentEditor.document;
            const lineNumber = selectionRange.start.line;
            const idx = doc.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
            const funcName = getSetting<string>("functionName");
            const wrapData: WrapData = {
                doc,
                idx,
                ind: doc.lineAt(lineNumber).text.substring(0, idx),
                isLastLine: doc.lineCount - 1 === lineNumber,
                item: doc.getText(selectionRange),
                line: lineNumber,
                ran: selectionRange,
                sel,
                txt: funcName,
            };

            const sc = getSetting<boolean>("useSemicolon") ? ";" : "";
            const q = getSetting<boolean>("useSingleQuotes") ? `'` : `"`;
            const ps = getSetting<boolean>("usePrefixSpace") ? " " : "";
            const p = getSetting<boolean>("useParentheses");

            const leftP = p ? "(" : " ";
            const rightP = p ? ")" : "";
            switch (type) {
                case "name": {
                    // prettier-ignore
                    wrapData.txt = `${funcName}${leftP}${wrapData.item}${rightP}${sc}`;
                    break;
                }
                case "nameValue": {
                    // prettier-ignore
                    wrapData.txt = `${funcName}${leftP}${q}${wrapData.item}${ps}${q}, ${wrapData.item}${rightP}${sc}`;
                    break;
                }
                default: {
                    // prettier-ignore
                    wrapData.txt = `${funcName}${leftP}${wrapData.item}${rightP}${sc}`;
                    break;
                }
            }
            resolve(wrapData);
        }
    });
};

const handle = async (type?: string) => {
    try {
        const wrap = await executeCommand(type);
        let nextLineInd: string = "";

        if (!wrap.isLastLine) {
            const nextLine = wrap.doc.lineAt(wrap.line + 1);
            nextLineInd = nextLine.text.substring(
                0,
                nextLine.firstNonWhitespaceCharacterIndex
            );
        }

        await currentEditor.edit((e) => {
            e.insert(
                new Position(
                    wrap.line,
                    wrap.doc.lineAt(wrap.line).range.end.character
                ),
                "\n".concat(
                    nextLineInd > wrap.ind ? nextLineInd : wrap.ind,
                    wrap.txt
                )
            );
        });
        currentEditor.selection = wrap.sel;
    } catch (err) {
        console.error(err);
    }
};

const getSetting = <T>(setting: string): T => {
    const settingId = `${EXTENSION_NAME}.${setting}`;
    const langKey = `[${currentEditor.document.languageId}]`;
    const config = workspace.getConfiguration("", currentEditor.document);
    const langWorkspaceValue =
        config.inspect<any>(langKey)?.workspaceValue?.[settingId];
    const langGlobalValue =
        config.inspect<any>(langKey)?.globalValue?.[settingId];
    const defaultValue = workspace.getConfiguration(EXTENSION_NAME)[setting];

    return langWorkspaceValue ?? langGlobalValue ?? defaultValue;
};

export const deactivate = () => {
    return undefined;
};
