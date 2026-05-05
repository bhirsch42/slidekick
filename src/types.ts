export interface Stepped {
  step?: number;
}

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

export interface SlideNode extends Stepped {
  kind: "slide";
  children: SlideChild[];
  background?: Background;
  align?: SlideAlign;
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
  runs: Run[];
  align?: ParagraphAlign;
}

export interface SubtitleNode extends Stepped {
  kind: "subtitle";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface HeadingNode extends Stepped {
  kind: "heading";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface BulletsNode extends Stepped {
  kind: "bullets";
  children: BulletNode[];
}

export interface BulletNode extends Stepped {
  kind: "bullet";
  runs: Run[];
  align?: ParagraphAlign;
}

export interface TextNode extends Stepped {
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

export interface ImageNode extends Stepped {
  kind: "image";
  src: string;
  alt?: string;
  fit?: ImageFit;
  crop?: ImageCrop;
}

export interface GroupNode extends Stepped {
  kind: "group";
  children: SlideChild[];
}

export type SlideChild =
  | TitleNode
  | SubtitleNode
  | HeadingNode
  | BulletsNode
  | TextNode
  | ImageNode
  | ColumnsNode
  | GroupNode;

export type Node = SlideNode | SlideChild | BulletNode | ColumnNode | SpanNode;

export type Deck = SlideNode[];

export interface DeckModule {
  theme?: Theme;
  slides: SlideNode[];
}

export type DeckInput = Deck | DeckModule;

export type Children<T> = T | null | undefined | false | true | Children<T>[];

export type TextChildren = InlineChildren;
