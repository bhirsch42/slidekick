import type { Node } from "../types.js";
import { type Placed } from "./layout.js";
export interface Frame {
    slideIndex: number;
    step: number;
}
export declare function expandFrames(placedDeck: Placed[][]): Frame[];
export interface ImagePptxOptions {
    widthPx?: number;
    onFrame?: (slideIndex: number, step: number, totalSlides: number) => void;
}
export interface ImagePptxStats {
    slideCount: number;
    frameCount: number;
}
export declare function renderImagePptx(slides: Node[], outPath: string, opts?: ImagePptxOptions): Promise<ImagePptxStats>;
