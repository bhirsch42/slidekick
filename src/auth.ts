import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/drive.file",
];

const TOKEN_PATH = join(homedir(), ".config", "slidekick", "token.json");

export function makeOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4242/oauth2callback";
  if (!clientId || !clientSecret) {
    throw new Error(
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.",
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function loadTokens(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveTokens(tokens: Record<string, unknown>): Promise<void> {
  await mkdir(dirname(TOKEN_PATH), { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export async function getAuthedClient(): Promise<OAuth2Client> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error('No saved credentials. Run "slidekick auth login" first.');
  }
  const client = makeOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

export async function login(): Promise<void> {
  const client = makeOAuth2Client();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log(`\nOpen this URL in your browser:\n\n  ${url}\n`);

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url ?? "", "http://localhost:4242");
      const c = u.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5"><div style="background:#fff;padding:2rem 3rem;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);text-align:center"><h1 style="margin:0 0 .5rem">slidekick authorized</h1><p style="margin:0;color:#666">You can close this tab.</p></div></body></html>`,
      );
      server.close();
      if (c) resolve(c);
      else reject(new Error("No code in redirect"));
    });
    server.listen(4242);
    console.log("Waiting for OAuth redirect on http://localhost:4242 ...\n");
  });

  const { tokens } = await client.getToken(code);
  await saveTokens(tokens as Record<string, unknown>);
  console.log(`\nSaved credentials to ${TOKEN_PATH}`);
}

export function tokenPath(): string {
  return TOKEN_PATH;
}

export function missingScopeHelp(): string {
  return `If you see "insufficient permissions" or "invalid_scope":

  In Google Cloud Console (the project owning these OAuth creds):
    1. Enable APIs:  Google Slides API, Google Drive API
    2. OAuth consent screen → add scopes:
         ${SCOPES.join("\n         ")}
    3. Re-run: slidekick auth login`;
}
