import type { OAuth2Client } from "google-auth-library";
import { type drive_v3, type slides_v1 } from "googleapis";
export interface Clients {
    slides: slides_v1.Slides;
    drive: drive_v3.Drive;
    auth: OAuth2Client;
}
export declare function getClients(): Promise<Clients>;
export declare function parsePresentationId(input: string): string;
export declare function presentationUrl(id: string): string;
