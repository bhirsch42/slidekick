import { pathToFileURL } from "node:url";
import type { Node } from "../types.js";

export async function loadDeck(entry: string): Promise<Node[]> {
  const url = pathToFileURL(entry).href + `?t=${Date.now()}`;
  const mod = (await import(url)) as { default?: unknown };
  const deckFn = mod.default;
  if (typeof deckFn !== "function") {
    throw new Error(`deck entry must default-export a function returning Slide[]: ${entry}`);
  }
  const result = await (deckFn as () => unknown)();
  if (!Array.isArray(result)) {
    throw new Error(`deck function must return an array of <Slide> elements`);
  }
  return result as Node[];
}
