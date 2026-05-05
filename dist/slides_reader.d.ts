import type { slides_v1 } from "googleapis";
import type { DeckModule } from "./types.js";
export declare function presentationToDeck(p: slides_v1.Schema$Presentation): DeckModule;
export declare function deckToTsx(deck: DeckModule): string;
