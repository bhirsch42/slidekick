import type {
  BulletNode,
  BulletsNode,
  Children,
  ColumnNode,
  ColumnsNode,
  GroupNode,
  HeadingNode,
  ImageNode,
  QuoteNode,
  SlideChild,
  SlideNode,
  SubtitleNode,
  TextChildren,
  TextNode,
  TitleNode,
} from "./types.js";

function joinText(c: TextChildren | undefined): string {
  if (c == null) return "";
  if (typeof c === "string") return c;
  if (typeof c === "number") return String(c);
  return c.map((p) => (typeof p === "number" ? String(p) : p)).join("");
}

function arr<T>(c: Children<T> | undefined): T[] {
  if (c == null) return [];
  return Array.isArray(c) ? c : [c];
}

export function Slide(props: { children?: Children<SlideChild>; step?: number }): SlideNode {
  return { kind: "slide", step: props.step, children: arr(props.children) };
}

export function Columns(props: {
  children?: Children<ColumnNode>;
  gap?: number;
  step?: number;
}): ColumnsNode {
  return {
    kind: "columns",
    step: props.step,
    gap: props.gap,
    children: arr(props.children),
  };
}

export function Column(props: {
  children?: Children<SlideChild>;
  weight?: number;
  step?: number;
}): ColumnNode {
  return {
    kind: "column",
    step: props.step,
    weight: props.weight,
    children: arr(props.children),
  };
}

export function Title(props: { children: TextChildren; step?: number }): TitleNode {
  return { kind: "title", step: props.step, text: joinText(props.children) };
}

export function Subtitle(props: { children: TextChildren; step?: number }): SubtitleNode {
  return { kind: "subtitle", step: props.step, text: joinText(props.children) };
}

export function Heading(props: { children: TextChildren; step?: number }): HeadingNode {
  return { kind: "heading", step: props.step, text: joinText(props.children) };
}

export function Bullets(props: { children: Children<BulletNode>; step?: number }): BulletsNode {
  return { kind: "bullets", step: props.step, children: arr(props.children) };
}

export function Bullet(props: { children: TextChildren; step?: number }): BulletNode {
  return { kind: "bullet", step: props.step, text: joinText(props.children) };
}

export function Text(props: { children: TextChildren; step?: number }): TextNode {
  return { kind: "text", step: props.step, text: joinText(props.children) };
}

export function Image(props: { src: string; alt?: string; step?: number }): ImageNode {
  return { kind: "image", step: props.step, src: props.src, alt: props.alt };
}

export function Quote(props: {
  children: TextChildren;
  attribution?: string;
  step?: number;
}): QuoteNode {
  return {
    kind: "quote",
    step: props.step,
    text: joinText(props.children),
    attribution: props.attribution,
  };
}

export function Group(props: { children?: Children<SlideChild>; step?: number }): GroupNode {
  return { kind: "group", step: props.step, children: arr(props.children) };
}
