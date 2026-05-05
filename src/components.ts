import type {
  Background,
  BulletNode,
  BulletsNode,
  Children,
  Color,
  ColumnNode,
  ColumnsNode,
  GroupNode,
  HeadingNode,
  ImageCrop,
  ImageFit,
  ImageNode,
  InlineChild,
  InlineChildren,
  ParagraphAlign,
  Run,
  RunStyle,
  SizeToken,
  SlideAlign,
  SlideChild,
  SlideNode,
  SpanNode,
  SubtitleNode,
  TextChildren,
  TextNode,
  TitleNode,
} from "./types.js";

function flatten<T>(c: Children<T> | undefined): T[] {
  if (c == null || c === false || c === true) return [];
  if (Array.isArray(c)) {
    const out: T[] = [];
    for (const x of c) out.push(...flatten<T>(x));
    return out;
  }
  return [c as T];
}

function stylesEqual(a: RunStyle | undefined, b: RunStyle | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.size === b.size &&
    a.weight === b.weight &&
    a.italic === b.italic &&
    a.font === b.font &&
    a.color === b.color &&
    !!a.cite === !!b.cite
  );
}

function mergeStyle(a: RunStyle, b: RunStyle | undefined): RunStyle {
  if (!b) return a;
  return {
    size: b.size ?? a.size,
    weight: b.weight ?? a.weight,
    italic: b.italic ?? a.italic,
    font: b.font ?? a.font,
    color: b.color ?? a.color,
    cite: b.cite ?? a.cite,
  };
}

function isEmptyStyle(s: RunStyle): boolean {
  return (
    s.size === undefined &&
    s.weight === undefined &&
    s.italic === undefined &&
    s.font === undefined &&
    s.color === undefined &&
    !s.cite
  );
}

export function flattenInline(children: InlineChildren | undefined): Run[] {
  const out: Run[] = [];

  function pushText(text: string, style: RunStyle): void {
    if (text === "") return;
    const last = out[out.length - 1];
    if (last && stylesEqual(last.style, isEmptyStyle(style) ? undefined : style)) {
      last.text += text;
      return;
    }
    out.push(isEmptyStyle(style) ? { text } : { text, style: { ...style } });
  }

  function visit(c: unknown, style: RunStyle): void {
    if (c == null || c === false || c === true) return;
    if (Array.isArray(c)) {
      for (const item of c) visit(item, style);
      return;
    }
    if (typeof c === "string") {
      pushText(c, style);
      return;
    }
    if (typeof c === "number") {
      pushText(String(c), style);
      return;
    }
    if (typeof c === "object" && (c as { kind?: unknown }).kind === "span") {
      const span = c as SpanNode;
      const merged = mergeStyle(style, span.style);
      visit(span.children, merged);
      return;
    }
  }

  visit(children, {});
  return out;
}

interface TextProps {
  children: TextChildren;
  step?: number;
  align?: ParagraphAlign;
}

export function Slide(props: {
  children?: Children<SlideChild>;
  step?: number;
  background?: Background;
  align?: SlideAlign;
}): SlideNode {
  return {
    kind: "slide",
    step: props.step,
    background: props.background,
    align: props.align,
    children: flatten<SlideChild>(props.children),
  };
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
    children: flatten<ColumnNode>(props.children),
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
    children: flatten<SlideChild>(props.children),
  };
}

export function Title(props: TextProps): TitleNode {
  return { kind: "title", step: props.step, runs: flattenInline(props.children), align: props.align };
}

export function Subtitle(props: TextProps): SubtitleNode {
  return { kind: "subtitle", step: props.step, runs: flattenInline(props.children), align: props.align };
}

export function Heading(props: TextProps): HeadingNode {
  return { kind: "heading", step: props.step, runs: flattenInline(props.children), align: props.align };
}

export function Bullets(props: { children: Children<BulletNode>; step?: number }): BulletsNode {
  return { kind: "bullets", step: props.step, children: flatten<BulletNode>(props.children) };
}

export function Bullet(props: TextProps): BulletNode {
  return { kind: "bullet", step: props.step, runs: flattenInline(props.children), align: props.align };
}

export function Text(props: TextProps): TextNode {
  return { kind: "text", step: props.step, runs: flattenInline(props.children), align: props.align };
}

export function Image(props: {
  src: string;
  alt?: string;
  step?: number;
  fit?: ImageFit;
  crop?: ImageCrop;
}): ImageNode {
  return {
    kind: "image",
    step: props.step,
    src: props.src,
    alt: props.alt,
    fit: props.fit,
    crop: props.crop,
  };
}

export function Group(props: { children?: Children<SlideChild>; step?: number }): GroupNode {
  return { kind: "group", step: props.step, children: flatten<SlideChild>(props.children) };
}

export function Span(props: {
  children?: TextChildren;
  size?: number | SizeToken;
  weight?: 400 | 700;
  italic?: boolean;
  font?: string;
  color?: Color;
}): SpanNode {
  const style: RunStyle = {};
  if (props.size !== undefined) style.size = props.size;
  if (props.weight !== undefined) style.weight = props.weight;
  if (props.italic !== undefined) style.italic = props.italic;
  if (props.font !== undefined) style.font = props.font;
  if (props.color !== undefined) style.color = props.color;
  return { kind: "span", children: props.children, style };
}

export function Em(props: { children?: TextChildren }): SpanNode {
  return { kind: "span", children: props.children, style: { italic: true } };
}

export function Strong(props: { children?: TextChildren }): SpanNode {
  return { kind: "span", children: props.children, style: { weight: 700 } };
}

export function Cite(props: { children?: TextChildren }): SpanNode {
  return { kind: "span", children: props.children, style: { italic: true, cite: true } };
}

// Re-export for unused-import suppression in transitive imports.
export type { InlineChild };
