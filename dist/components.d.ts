import type { Background, BulletNode, BulletsNode, Children, Color, ColumnNode, ColumnsNode, GroupNode, HeadingNode, ImageCrop, ImageFit, ImageNode, InlineChild, InlineChildren, ParagraphAlign, Run, SizeToken, SlideAlign, SlideChild, SlideNode, SpanNode, SubtitleNode, TextChildren, TextNode, TitleNode } from "./types.js";
export declare function flattenInline(children: InlineChildren | undefined): Run[];
interface TextProps {
    children: TextChildren;
    step?: number;
    align?: ParagraphAlign;
}
export declare function Slide(props: {
    children?: Children<SlideChild>;
    step?: number;
    background?: Background;
    align?: SlideAlign;
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
export declare function Title(props: TextProps): TitleNode;
export declare function Subtitle(props: TextProps): SubtitleNode;
export declare function Heading(props: TextProps): HeadingNode;
export declare function Bullets(props: {
    children: Children<BulletNode>;
    step?: number;
}): BulletsNode;
export declare function Bullet(props: TextProps): BulletNode;
export declare function Text(props: TextProps): TextNode;
export declare function Image(props: {
    src: string;
    alt?: string;
    step?: number;
    fit?: ImageFit;
    crop?: ImageCrop;
}): ImageNode;
export declare function Group(props: {
    children?: Children<SlideChild>;
    step?: number;
}): GroupNode;
export declare function Span(props: {
    children?: TextChildren;
    size?: number | SizeToken;
    weight?: 400 | 700;
    italic?: boolean;
    font?: string;
    color?: Color;
}): SpanNode;
export declare function Em(props: {
    children?: TextChildren;
}): SpanNode;
export declare function Strong(props: {
    children?: TextChildren;
}): SpanNode;
export declare function Cite(props: {
    children?: TextChildren;
}): SpanNode;
export type { InlineChild };
