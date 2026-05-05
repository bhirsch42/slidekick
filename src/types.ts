export type Color = string;

export type SizeToken = "sm" | "md" | "lg";

export interface RunStyle {
  size?: number | SizeToken;
  weight?: 400 | 700;
  italic?: boolean;
  font?: string;
  color?: Color;
  cite?: boolean;
}

export interface Run {
  text: string;
  style?: RunStyle;
}

export interface SpanNode {
  kind: "span";
  children?: InlineChildren;
  style?: RunStyle;
}

export type InlineChild = string | number | SpanNode;
export type InlineChildren = InlineChild | InlineChild[];

export type TextRole = "title" | "subtitle" | "heading" | "text" | "bullet";

export type ParagraphAlign = "start" | "center" | "end";

export interface Theme {
  background?: Color;
  text?: Color;
  accent?: Color;
  fonts?: {
    body?: string;
    display?: string;
    mono?: string;
  };
  sizes?: Partial<Record<TextRole, number>>;
}

export type Background = Color | { image: string; scrim?: number | Color };

export type SlideAlign = "start" | "center" | "end";

export interface SlideNode {
  kind: "slide";
  children: SlideChild[];
  background?: Background;
  align?: SlideAlign;
}

export interface ColumnsNode {
  kind: "columns";
  gap?: number;
  children: ColumnNode[];
}

export interface ColumnNode {
  kind: "column";
  weight?: number;
  children: SlideChild[];
}

export interface TitleNode {
  kind: "title";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface SubtitleNode {
  kind: "subtitle";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface HeadingNode {
  kind: "heading";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface BulletsNode {
  kind: "bullets";
  children: BulletNode[];
}

export interface BulletNode {
  kind: "bullet";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface TextNode {
  kind: "text";
  runs: Run[];
  align?: ParagraphAlign;
}

export type ImageFit = "contain" | "cover" | "fill";

export interface ImageCrop {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface ImageNode {
  kind: "image";
  src: string;
  alt?: string;
  fit?: ImageFit;
  crop?: ImageCrop;
}

export type SlideChild =
  | TitleNode
  | SubtitleNode
  | HeadingNode
  | BulletsNode
  | TextNode
  | ImageNode
  | ColumnsNode;

export type Node = SlideNode | SlideChild | BulletNode | ColumnNode | SpanNode;

export type Deck = SlideNode[];

export interface DeckModule {
  theme?: Theme;
  slides: SlideNode[];
}

export type DeckInput = Deck | DeckModule;

export type Children<T> = T | null | undefined | false | true | Children<T>[];

export type TextChildren = InlineChildren;
