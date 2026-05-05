import type { BulletNode, BulletsNode, Children, ColumnNode, ColumnsNode, GroupNode, HeadingNode, ImageNode, QuoteNode, SlideChild, SlideNode, SubtitleNode, TextChildren, TextNode, TitleNode } from "./types.js";
export declare function Slide(props: {
    children?: Children<SlideChild>;
    step?: number;
}): SlideNode;
export declare function Columns(props: {
    children?: Children<ColumnNode>;
    gap?: number;
    step?: number;
}): ColumnsNode;
export declare function Column(props: {
    children?: Children<SlideChild>;
    weight?: number;
    step?: number;
}): ColumnNode;
export declare function Title(props: {
    children: TextChildren;
    step?: number;
}): TitleNode;
export declare function Subtitle(props: {
    children: TextChildren;
    step?: number;
}): SubtitleNode;
export declare function Heading(props: {
    children: TextChildren;
    step?: number;
}): HeadingNode;
export declare function Bullets(props: {
    children: Children<BulletNode>;
    step?: number;
}): BulletsNode;
export declare function Bullet(props: {
    children: TextChildren;
    step?: number;
}): BulletNode;
export declare function Text(props: {
    children: TextChildren;
    step?: number;
}): TextNode;
export declare function Image(props: {
    src: string;
    alt?: string;
    step?: number;
}): ImageNode;
export declare function Quote(props: {
    children: TextChildren;
    attribution?: string;
    step?: number;
}): QuoteNode;
export declare function Group(props: {
    children?: Children<SlideChild>;
    step?: number;
}): GroupNode;
