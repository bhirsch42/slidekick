import type { slides_v1 } from "googleapis";
import { layoutDeck, type Placed, SLIDE_H, SLIDE_W, type TextRole } from "./layout.js";
import type { Deck } from "./types.js";

type Request = slides_v1.Schema$Request;

export interface PageDims {
  widthPt: number;
  heightPt: number;
}

export const DEFAULT_PAGE: PageDims = { widthPt: SLIDE_W * 72, heightPt: SLIDE_H * 72 };

export interface WriterOptions {
  page?: PageDims;
}

interface Style {
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  alignment?: "START" | "CENTER" | "END";
}

const ROLE_STYLE: Record<TextRole, Style> = {
  title: { fontSize: 36, bold: true },
  subtitle: { fontSize: 22 },
  heading: { fontSize: 22, bold: true },
  text: { fontSize: 16 },
  quote: { fontSize: 22, italic: true, alignment: "CENTER" },
  attribution: { fontSize: 14, alignment: "CENTER" },
};

const BULLETS_STYLE: Style = { fontSize: 18 };

export function deckToRequests(deck: Deck, opts: WriterOptions = {}): Request[] {
  const page = opts.page ?? DEFAULT_PAGE;
  const sx = page.widthPt / SLIDE_W;
  const sy = page.heightPt / SLIDE_H;

  const placed = layoutDeck(deck);
  const requests: Request[] = [];

  placed.forEach((slidePlaced, slideIdx) => {
    const slideId = `sk_s_${slideIdx}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: "BLANK" },
      },
    });

    slidePlaced.forEach((p, i) => {
      const elementId = `sk_e_${slideIdx}_${i}`;
      const x = p.x * sx;
      const y = p.y * sy;
      const w = p.w * sx;
      const h = p.h * sy;
      emitElement(requests, slideId, elementId, p, x, y, w, h);
    });
  });

  return requests;
}

function emitElement(
  out: Request[],
  slideId: string,
  elementId: string,
  p: Placed,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const elementProperties: slides_v1.Schema$PageElementProperties = {
    pageObjectId: slideId,
    size: {
      width: { magnitude: w, unit: "PT" },
      height: { magnitude: h, unit: "PT" },
    },
    transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: "PT" },
  };

  if (p.kind === "image") {
    out.push({ createImage: { objectId: elementId, url: p.src, elementProperties } });
    return;
  }

  out.push({
    createShape: { objectId: elementId, shapeType: "TEXT_BOX", elementProperties },
  });

  if (p.kind === "text") {
    if (p.text.length > 0) {
      out.push({ insertText: { objectId: elementId, text: p.text, insertionIndex: 0 } });
      applyStyle(out, elementId, ROLE_STYLE[p.role], p.text.length);
    }
    return;
  }

  // bullets
  const text = p.bullets.map((b) => b.text).join("\n");
  if (text.length === 0) return;
  out.push({ insertText: { objectId: elementId, text, insertionIndex: 0 } });
  applyStyle(out, elementId, BULLETS_STYLE, text.length);
  out.push({
    createParagraphBullets: {
      objectId: elementId,
      textRange: { type: "ALL" },
      bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
    },
  });
}

function applyStyle(out: Request[], objectId: string, style: Style, textLength: number): void {
  if (textLength === 0) return;
  const fields: string[] = ["fontSize"];
  const textStyle: slides_v1.Schema$TextStyle = {
    fontSize: { magnitude: style.fontSize, unit: "PT" },
  };
  if (style.bold) {
    textStyle.bold = true;
    fields.push("bold");
  }
  if (style.italic) {
    textStyle.italic = true;
    fields.push("italic");
  }
  out.push({
    updateTextStyle: {
      objectId,
      style: textStyle,
      fields: fields.join(","),
      textRange: { type: "ALL" },
    },
  });

  if (style.alignment) {
    out.push({
      updateParagraphStyle: {
        objectId,
        style: { alignment: style.alignment },
        fields: "alignment",
        textRange: { type: "ALL" },
      },
    });
  }
}

export function deleteAllSlidesRequests(presentation: slides_v1.Schema$Presentation): Request[] {
  const slides = presentation.slides ?? [];
  return slides
    .map((s) => s.objectId)
    .filter((id): id is string => typeof id === "string")
    .map((objectId) => ({ deleteObject: { objectId } }));
}

export function presentationPageDims(p: slides_v1.Schema$Presentation): PageDims {
  const size = p.pageSize;
  const w = size?.width;
  const h = size?.height;
  if (!w?.magnitude || !h?.magnitude) return DEFAULT_PAGE;
  const widthPt = toPt(w.magnitude, w.unit ?? "EMU");
  const heightPt = toPt(h.magnitude, h.unit ?? "EMU");
  return { widthPt, heightPt };
}

function toPt(magnitude: number, unit: string): number {
  if (unit === "PT") return magnitude;
  if (unit === "EMU") return magnitude / 12700;
  return magnitude;
}
