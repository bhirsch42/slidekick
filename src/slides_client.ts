import type { OAuth2Client } from "google-auth-library";
import { type drive_v3, google, type slides_v1 } from "googleapis";
import { getAuthedClient } from "./auth.js";

export interface Clients {
  slides: slides_v1.Slides;
  drive: drive_v3.Drive;
  auth: OAuth2Client;
}

export async function getClients(): Promise<Clients> {
  const auth = await getAuthedClient();
  return {
    auth,
    slides: google.slides({ version: "v1", auth }),
    drive: google.drive({ version: "v3", auth }),
  };
}

export function parsePresentationId(input: string): string {
  const m = /\/presentation\/d\/([a-zA-Z0-9_-]+)/.exec(input);
  if (m) return m[1] as string;
  return input;
}

export function presentationUrl(id: string): string {
  return `https://docs.google.com/presentation/d/${id}/edit`;
}
