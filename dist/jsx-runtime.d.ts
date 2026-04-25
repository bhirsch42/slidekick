import type { Node } from "./types.js";
export declare function jsx(type: unknown, props: object | null, _key?: unknown): Node;
export declare const jsxs: typeof jsx;
export declare const jsxDEV: typeof jsx;
export declare function Fragment(props: object): Node;
export declare function makeNode(type: string, props: object): Node;
export declare namespace JSX {
    interface Element extends Node {
    }
    interface ElementChildrenAttribute {
        children: Record<string, unknown>;
    }
    interface IntrinsicElements {
    }
}
