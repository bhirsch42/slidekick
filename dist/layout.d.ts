import type { Background, Deck, ImageCrop, ImageFit, ParagraphAlign, Run, SlideAlign, TextRole } from "./types.js";
export declare const SLIDE_W = 13.333;
export declare const SLIDE_H = 7.5;
export type { TextRole };
export interface BulletItem {
    runs: Run[];
    align?: ParagraphAlign;
}
export type Placed = {
    kind: "text";
    role: TextRole;
    runs: Run[];
    align?: ParagraphAlign;
    x: number;
    y: number;
    w: number;
    h: number;
} | {
    kind: "bullets";
    bullets: BulletItem[];
    x: number;
    y: number;
    w: number;
    h: number;
} | {
    kind: "image";
    src: string;
    alt?: string;
    fit: ImageFit;
    crop?: ImageCrop;
    x: number;
    y: number;
    w: number;
    h: number;
};
export interface SlideLayout {
    background?: Background;
    align?: SlideAlign;
    placed: Placed[];
}
export declare function layoutDeck(deck: Deck): SlideLayout[];
