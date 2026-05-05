import type { Node } from "./types.js";

export function jsx<P, R>(type: (props: P) => R, props: P, _key?: unknown): R {
  return type(props);
}

export const jsxs = jsx;
export const jsxDEV = jsx;

export function Fragment(_props: unknown): never {
  throw new Error("Fragments (<>...</>) are not supported in slidekick. Use <Group> instead.");
}

export namespace JSX {
  export type Element = Node;
  export interface IntrinsicElements {}
  export interface ElementChildrenAttribute {
    children: Record<string, unknown>;
  }
}
