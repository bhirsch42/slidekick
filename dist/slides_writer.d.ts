import type { slides_v1 } from "googleapis";
import type { Color, DeckInput } from "./types.js";
type Request = slides_v1.Schema$Request;
export interface PageDims {
    widthPt: number;
    heightPt: number;
}
export declare const DEFAULT_PAGE: PageDims;
export interface WriterOptions {
    page?: PageDims;
}
export declare function deckToRequests(input: DeckInput, opts?: WriterOptions): Request[];
export declare function parseColor(c: Color): {
    red: number;
    green: number;
    blue: number;
} | null;
export declare function deleteAllSlidesRequests(presentation: slides_v1.Schema$Presentation): Request[];
export declare function presentationPageDims(p: slides_v1.Schema$Presentation): PageDims;
export {};
