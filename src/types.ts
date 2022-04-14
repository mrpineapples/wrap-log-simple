import { TextDocument, Range, Selection } from "vscode";

export type WrapData = {
    doc: TextDocument;
    idx: number;
    ind: string;
    item: string;
    isLastLine: boolean;
    line: number;
    ran: Range;
    sel: Selection;
    txt: string;
};

export enum Command {
    Name = "name",
    NameValue = "nameValue",
}
