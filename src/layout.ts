import type {
  Background,
  BulletNode,
  ColumnNode,
  Deck,
  ImageCrop,
  ImageFit,
  ParagraphAlign,
  Run,
  SlideAlign,
  SlideChild,
  SlideNode,
  TextRole,
} from "./types.js";

export const SLIDE_W = 13.333;
export const SLIDE_H = 7.5;

const PAD = 0.5;
const GAP = 0.2;
const TITLE_H = 1.0;
const SUBTITLE_H = 0.7;
const HEADING_H = 0.5;
const TEXT_NAT_H = 0.6;
const BULLET_NAT_H = 0.4;
const IMAGE_NAT_H = 3.0;

export type { TextRole };

export interface BulletItem {
  runs: Run[];
  align?: ParagraphAlign;
  step: number;
}

export type Placed =
  | {
      kind: "text";
      role: TextRole;
      runs: Run[];
      align?: ParagraphAlign;
      x: number;
      y: number;
      w: number;
      h: number;
      step: number;
    }
  | {
      kind: "bullets";
      bullets: BulletItem[];
      x: number;
      y: number;
      w: number;
      h: number;
      step: number;
    }
  | {
      kind: "image";
      src: string;
      alt?: string;
      fit: ImageFit;
      crop?: ImageCrop;
      x: number;
      y: number;
      w: number;
      h: number;
      step: number;
    };

export interface SlideLayout {
  background?: Background;
  align?: SlideAlign;
  placed: Placed[];
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

type StepFor = (i: number) => number;

const constStep = (s: number): StepFor => () => s;

export function layoutDeck(deck: Deck): SlideLayout[] {
  return deck.map(layoutSlide);
}

function layoutSlide(slide: SlideNode): SlideLayout {
  const out: Placed[] = [];
  const hasChildren = slide.children.length > 0;
  const padded = !slide.background || hasChildren;
  const pad = padded ? PAD : 0;
  const area: Box = { x: pad, y: pad, w: SLIDE_W - 2 * pad, h: SLIDE_H - 2 * pad };
  const slideStep = slide.step ?? 0;
  if (slide.align && hasChildren) {
    layoutAligned(slide.children, area, out, slideStep, slide.align);
  } else {
    layoutVertical(slide.children, area, out, constStep(slideStep), slideStep);
  }
  return { background: slide.background, align: slide.align, placed: out };
}

function fixedHeight(child: SlideChild): number | null {
  if (child.kind === "title") return TITLE_H;
  if (child.kind === "subtitle") return SUBTITLE_H;
  if (child.kind === "heading") return HEADING_H;
  return null;
}

function naturalHeight(child: SlideChild): number {
  const fixed = fixedHeight(child);
  if (fixed != null) return fixed;
  switch (child.kind) {
    case "text":
      return TEXT_NAT_H;
    case "bullets":
      return Math.max(BULLET_NAT_H, child.children.length * BULLET_NAT_H);
    case "image":
      return IMAGE_NAT_H;
    case "columns":
    case "group":
      return 1.0;
    default:
      return TEXT_NAT_H;
  }
}

function layoutVertical(
  children: SlideChild[],
  area: Box,
  out: Placed[],
  stepFor: StepFor,
  inheritedStep: number,
): void {
  if (children.length === 0) return;
  const fixedTotal = children.reduce((s, c) => s + (fixedHeight(c) ?? 0), 0);
  const flexCount = children.filter((c) => fixedHeight(c) === null).length;
  const totalGaps = Math.max(0, children.length - 1) * GAP;
  const flexAvailable = Math.max(0, area.h - fixedTotal - totalGaps);
  const flexEach = flexCount > 0 ? flexAvailable / flexCount : 0;

  let y = area.y;
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const h = fixedHeight(child) ?? flexEach;
    layoutChild(child, { x: area.x, y, w: area.w, h }, out, stepFor(i), inheritedStep);
    y += h + GAP;
  }
}

function layoutAligned(
  children: SlideChild[],
  area: Box,
  out: Placed[],
  inheritedStep: number,
  align: SlideAlign,
): void {
  const heights = children.map(naturalHeight);
  const totalGaps = Math.max(0, children.length - 1) * GAP;
  const total = heights.reduce((s, h) => s + h, 0) + totalGaps;
  const slack = Math.max(0, area.h - total);
  const offset = align === "center" ? slack / 2 : align === "end" ? slack : 0;
  let y = area.y + offset;
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const h = heights[i]!;
    layoutChild(child, { x: area.x, y, w: area.w, h }, out, inheritedStep, inheritedStep);
    y += h + GAP;
  }
}

function layoutChild(
  node: SlideChild,
  area: Box,
  out: Placed[],
  stepHint: number,
  inheritedStep: number,
): void {
  const step = node.step ?? stepHint;
  switch (node.kind) {
    case "title":
    case "subtitle":
    case "heading":
    case "text":
      out.push({
        kind: "text",
        role: node.kind,
        runs: node.runs,
        align: node.align,
        ...area,
        step,
      });
      return;
    case "bullets": {
      const bullets: BulletItem[] = node.children.map((b: BulletNode) => ({
        runs: b.runs,
        align: b.align,
        step: b.step ?? step,
      }));
      out.push({ kind: "bullets", bullets, ...area, step });
      return;
    }
    case "image":
      out.push({
        kind: "image",
        src: node.src,
        alt: node.alt,
        fit: node.fit ?? "contain",
        crop: node.crop,
        ...area,
        step,
      });
      return;
    case "columns": {
      const cols = node.children;
      if (cols.length === 0) return;
      const totalWeight = cols.reduce((s, c: ColumnNode) => s + (c.weight ?? 1), 0);
      const gap = node.gap ?? 0.3;
      const totalGap = (cols.length - 1) * gap;
      const usableW = Math.max(0, area.w - totalGap);
      let x = area.x;
      for (const col of cols) {
        const w = ((col.weight ?? 1) / totalWeight) * usableW;
        const colStep = col.step ?? step;
        layoutVertical(
          col.children,
          { x, y: area.y, w, h: area.h },
          out,
          constStep(colStep),
          colStep,
        );
        x += w + gap;
      }
      return;
    }
    case "group": {
      const explicit = typeof node.step === "number";
      const stepFor: StepFor = explicit ? constStep(step) : (i) => i + 1;
      layoutVertical(node.children, area, out, stepFor, step);
      return;
    }
  }
}
