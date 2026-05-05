import type { BulletNode, ColumnNode, Deck, SlideChild, SlideNode } from "./types.js";

export const SLIDE_W = 13.333;
export const SLIDE_H = 7.5;

const PAD = 0.5;
const GAP = 0.2;
const TITLE_H = 1.0;
const SUBTITLE_H = 0.7;
const HEADING_H = 0.5;

export type TextRole = "title" | "subtitle" | "heading" | "text" | "quote" | "attribution";

export interface BulletItem {
  text: string;
  step: number;
}

export type Placed =
  | { kind: "text"; role: TextRole; text: string; x: number; y: number; w: number; h: number; step: number }
  | { kind: "bullets"; bullets: BulletItem[]; x: number; y: number; w: number; h: number; step: number }
  | { kind: "image"; src: string; alt?: string; x: number; y: number; w: number; h: number; step: number };

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

type StepFor = (i: number) => number;

const constStep = (s: number): StepFor => () => s;

export function layoutDeck(deck: Deck): Placed[][] {
  return deck.map(layoutSlide);
}

function layoutSlide(slide: SlideNode): Placed[] {
  const out: Placed[] = [];
  const area: Box = { x: PAD, y: PAD, w: SLIDE_W - 2 * PAD, h: SLIDE_H - 2 * PAD };
  const slideStep = slide.step ?? 0;
  layoutVertical(slide.children, area, out, constStep(slideStep), slideStep);
  return out;
}

function fixedHeight(child: SlideChild): number | null {
  if (child.kind === "title") return TITLE_H;
  if (child.kind === "subtitle") return SUBTITLE_H;
  if (child.kind === "heading") return HEADING_H;
  return null;
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
      out.push({ kind: "text", role: node.kind, text: node.text, ...area, step });
      return;
    case "bullets": {
      const bullets: BulletItem[] = node.children.map((b: BulletNode) => ({
        text: b.text,
        step: b.step ?? step,
      }));
      out.push({ kind: "bullets", bullets, ...area, step });
      return;
    }
    case "image":
      out.push({ kind: "image", src: node.src, alt: node.alt, ...area, step });
      return;
    case "quote": {
      const attrH = node.attribution ? 0.5 : 0;
      out.push({
        kind: "text",
        role: "quote",
        text: node.text,
        x: area.x,
        y: area.y,
        w: area.w,
        h: area.h - attrH,
        step,
      });
      if (node.attribution) {
        out.push({
          kind: "text",
          role: "attribution",
          text: `— ${node.attribution}`,
          x: area.x,
          y: area.y + area.h - attrH,
          w: area.w,
          h: attrH,
          step,
        });
      }
      return;
    }
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
