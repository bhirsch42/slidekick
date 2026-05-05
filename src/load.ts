import { pathToFileURL } from "node:url";
import type { DeckModule, SlideNode, Theme } from "./types.js";

export async function loadDeck(entry: string): Promise<DeckModule> {
  const url = `${pathToFileURL(entry).href}?t=${Date.now()}`;
  const mod = (await import(url)) as { default?: unknown };
  const deckFn = mod.default;
  if (typeof deckFn !== "function") {
    throw new Error(
      `deck entry must default-export a function returning Slide[] or { theme?, slides }: ${entry}`,
    );
  }
  const result = await (deckFn as () => unknown)();
  return normalizeResult(result);
}

function normalizeResult(result: unknown): DeckModule {
  if (Array.isArray(result)) {
    const slides = flattenSlides(result);
    assertSlides(slides);
    return { slides };
  }
  if (result && typeof result === "object" && "slides" in result) {
    const r = result as { theme?: unknown; slides?: unknown };
    if (!Array.isArray(r.slides)) {
      throw new Error(
        `deck object's "slides" property must be an array of <Slide> elements`,
      );
    }
    const slides = flattenSlides(r.slides);
    assertSlides(slides);
    return { theme: r.theme as Theme | undefined, slides };
  }
  throw new Error(
    `deck function must return an array of <Slide> elements or { theme?, slides }`,
  );
}

function flattenSlides(input: unknown): SlideNode[] {
  const out: SlideNode[] = [];
  function visit(c: unknown): void {
    if (c == null || c === false || c === true) return;
    if (Array.isArray(c)) {
      for (const x of c) visit(x);
      return;
    }
    out.push(c as SlideNode);
  }
  visit(input);
  return out;
}

function assertSlides(arr: unknown[]): void {
  for (const s of arr) {
    if (
      !s ||
      typeof s !== "object" ||
      (s as { kind?: unknown }).kind !== "slide"
    ) {
      throw new Error("deck array must contain only <Slide> elements");
    }
  }
}
