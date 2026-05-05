export interface Stepped {
    step?: number;
}
export interface SlideNode extends Stepped {
    kind: "slide";
    children: SlideChild[];
}
export interface ColumnsNode extends Stepped {
    kind: "columns";
    gap?: number;
    children: ColumnNode[];
}
export interface ColumnNode extends Stepped {
    kind: "column";
    weight?: number;
    children: SlideChild[];
}
export interface TitleNode extends Stepped {
    kind: "title";
    text: string;
}
export interface SubtitleNode extends Stepped {
    kind: "subtitle";
    text: string;
}
export interface HeadingNode extends Stepped {
    kind: "heading";
    text: string;
}
export interface BulletsNode extends Stepped {
    kind: "bullets";
    children: BulletNode[];
}
export interface BulletNode extends Stepped {
    kind: "bullet";
    text: string;
}
export interface TextNode extends Stepped {
    kind: "text";
    text: string;
}
export interface ImageNode extends Stepped {
    kind: "image";
    src: string;
    alt?: string;
}
export interface QuoteNode extends Stepped {
    kind: "quote";
    text: string;
    attribution?: string;
}
export interface GroupNode extends Stepped {
    kind: "group";
    children: SlideChild[];
}
export type SlideChild = TitleNode | SubtitleNode | HeadingNode | BulletsNode | TextNode | ImageNode | QuoteNode | ColumnsNode | GroupNode;
export type Node = SlideNode | SlideChild | BulletNode | ColumnNode;
export type Deck = SlideNode[];
export type Children<T> = T | T[];
export type TextChildren = string | number | (string | number)[];
