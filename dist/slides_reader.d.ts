import type { slides_v1 } from "googleapis";
import type { Deck } from "./types.js";
export declare function presentationToDeck(p: slides_v1.Schema$Presentation): Deck;
export declare function deckToTsx(deck: Deck): string;
