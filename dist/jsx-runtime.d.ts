import type { Node } from "./types.js";
export declare function jsx<P, R>(type: (props: P) => R, props: P, _key?: unknown): R;
export declare const jsxs: typeof jsx;
export declare const jsxDEV: typeof jsx;
export declare function Fragment(_props: unknown): never;
export declare namespace JSX {
    type Element = Node;
    interface IntrinsicElements {
    }
    interface ElementChildrenAttribute {
        children: Record<string, unknown>;
    }
}
