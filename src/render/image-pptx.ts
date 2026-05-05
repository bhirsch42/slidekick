import puppeteer from "puppeteer";
import pptxgen from "pptxgenjs";
import type { Node } from "../types.js";
import { layoutDeck, SLIDE_W, SLIDE_H, type Placed } from "./layout.js";
import { renderSlideStill, maxStepOf, BASE_SCALE } from "./screenshot.js";

export interface Frame {
  slideIndex: number;
  step: number;
}

export function expandFrames(placedDeck: Placed[][]): Frame[] {
  const frames: Frame[] = [];
  for (let i = 0; i < placedDeck.length; i++) {
    const max = maxStepOf(placedDeck[i]!);
    for (let step = 0; step <= max; step++) {
      frames.push({ slideIndex: i, step });
    }
  }
  return frames;
}

const PptxCtor = pptxgen as unknown as new () => any;

export interface ImagePptxOptions {
  widthPx?: number;
  onFrame?: (slideIndex: number, step: number, totalSlides: number) => void;
}

export interface ImagePptxStats {
  slideCount: number;
  frameCount: number;
}

export async function renderImagePptx(
  slides: Node[],
  outPath: string,
  opts: ImagePptxOptions = {},
): Promise<ImagePptxStats> {
  const widthPx = opts.widthPx ?? 1920;
  const baseW = Math.round(SLIDE_W * BASE_SCALE);
  const baseH = Math.round(SLIDE_H * BASE_SCALE);
  const dsf = widthPx / baseW;

  const placedDeck = layoutDeck(slides);

  const browser = await puppeteer.launch({ headless: true });
  let frameCount = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: baseW, height: baseH, deviceScaleFactor: dsf });

    const pptx = new PptxCtor();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = "slidekick deck";

    const frames = expandFrames(placedDeck);
    for (const { slideIndex, step } of frames) {
      const placed = placedDeck[slideIndex]!;
      const html = renderSlideStill(placed, step);
      await page.setContent(html, { waitUntil: "load" });
      const raw = await page.screenshot({ type: "png", omitBackground: false });
      const dataUrl = `image/png;base64,${Buffer.from(raw).toString("base64")}`;
      const slide = pptx.addSlide();
      slide.background = { color: "FAFAFA" };
      slide.addImage({ data: dataUrl, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
      frameCount++;
      opts.onFrame?.(slideIndex, step, placedDeck.length);
    }

    await pptx.writeFile({ fileName: outPath });
  } finally {
    await browser.close();
  }

  return { slideCount: placedDeck.length, frameCount };
}
