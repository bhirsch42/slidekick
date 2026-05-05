import type { Node } from "./types.js";

export function jsx<P, R>(type: (props: P) => R, props: P, _key?: unknown): R {
  return type(props);
}

export const jsxs = jsx;
export const jsxDEV = jsx;

export function Fragment(props: { children?: unknown }): unknown {
  if (props.children == null) return [];
  return props.children;
}

export namespace JSX {
  export type Element = Node | Node[] | readonly Node[] | null | undefined | false;
  export interface IntrinsicElements {}
  export interface ElementChildrenAttribute {
    children: Record<string, unknown>;
  }
}
