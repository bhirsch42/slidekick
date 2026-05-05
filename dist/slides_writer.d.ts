import type { slides_v1 } from "googleapis";
import type { Deck } from "./types.js";
type Request = slides_v1.Schema$Request;
export interface PageDims {
    widthPt: number;
    heightPt: number;
}
export declare const DEFAULT_PAGE: PageDims;
export interface WriterOptions {
    page?: PageDims;
}
export declare function deckToRequests(deck: Deck, opts?: WriterOptions): Request[];
export declare function deleteAllSlidesRequests(presentation: slides_v1.Schema$Presentation): Request[];
export declare function presentationPageDims(p: slides_v1.Schema$Presentation): PageDims;
export {};
