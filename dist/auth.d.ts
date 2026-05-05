import type { OAuth2Client } from "google-auth-library";
export declare function makeOAuth2Client(): OAuth2Client;
export declare function loadTokens(): Promise<Record<string, unknown> | null>;
export declare function getAuthedClient(): Promise<OAuth2Client>;
export declare function login(): Promise<void>;
export declare function tokenPath(): string;
export declare function missingScopeHelp(): string;
