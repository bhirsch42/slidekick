import type { Node } from "../types.js";
export declare const SLIDE_W = 13.333;
export declare const SLIDE_H = 7.5;
export interface BulletItem {
    text: string;
    step: number;
}
export type Placed = {
    kind: "text";
    role: TextRole;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    step: number;
} | {
    kind: "bullets";
    bullets: BulletItem[];
    x: number;
    y: number;
    w: number;
    h: number;
    step: number;
} | {
    kind: "image";
    src: string;
    alt?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    step: number;
};
export type TextRole = "title" | "subtitle" | "heading" | "text" | "quote" | "attribution";
export declare function layoutDeck(slides: Node[]): Placed[][];
