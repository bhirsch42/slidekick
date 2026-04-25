import type { Node } from "./types.js";

export function jsx(type: unknown, props: object | null, _key?: unknown): Node {
  const safeProps = props ?? {};
  if (typeof type === "function") {
    return (type as (p: object) => Node)(safeProps);
  }
  return makeNode(String(type), safeProps);
}

export const jsxs = jsx;
export const jsxDEV = jsx;

export function Fragment(props: object): Node {
  return makeNode("fragment", props);
}

export function makeNode(type: string, props: object): Node {
  const { children, ...rest } = props as Record<string, unknown>;
  return { type, props: rest, children: toChildArray(children) };
}

function toChildArray(children: unknown): Node[] {
  if (children == null || typeof children === "boolean") return [];
  const arr = Array.isArray(children) ? children : [children];
  const out: Node[] = [];
  for (const c of arr) {
    if (c == null || typeof c === "boolean") continue;
    if (typeof c === "string" || typeof c === "number") {
      out.push({ type: "text", props: { value: String(c) }, children: [] });
    } else if (Array.isArray(c)) {
      out.push(...toChildArray(c));
    } else if (typeof c === "object" && c !== null && "type" in c) {
      out.push(c as Node);
    }
  }
  return out;
}

export namespace JSX {
  export interface Element extends Node {}
  export interface ElementChildrenAttribute {
    children: Record<string, unknown>;
  }
  export interface IntrinsicElements {}
}
