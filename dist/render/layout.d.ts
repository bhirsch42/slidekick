import type { Node } from "../types.js";
export declare const SLIDE_W = 13.333;
export declare const SLIDE_H = 7.5;
export type Placed = {
    kind: "text";
    role: TextRole;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
} | {
    kind: "bullets";
    bullets: string[];
    x: number;
    y: number;
    w: number;
    h: number;
} | {
    kind: "image";
    src: string;
    alt?: string;
    x: number;
    y: number;
    w: number;
    h: number;
};
export type TextRole = "title" | "subtitle" | "heading" | "text" | "quote" | "attribution";
export declare function layoutDeck(slides: Node[]): Placed[][];
