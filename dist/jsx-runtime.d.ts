import type { Node } from "./types.js";
export declare function jsx<P, R>(type: (props: P) => R, props: P, _key?: unknown): R;
export declare const jsxs: typeof jsx;
export declare const jsxDEV: typeof jsx;
export declare function Fragment(props: {
    children?: unknown;
}): unknown;
export declare namespace JSX {
    type Element = Node | Node[] | readonly Node[] | null | undefined | false;
    type IntrinsicElements = {};
    interface ElementChildrenAttribute {
        children: Record<string, unknown>;
    }
}
