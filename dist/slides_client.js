import { google } from "googleapis";
import { getAuthedClient } from "./auth.js";
export async function getClients() {
    const auth = await getAuthedClient();
    return {
        auth,
        slides: google.slides({ version: "v1", auth }),
        drive: google.drive({ version: "v3", auth }),
    };
}
export function parsePresentationId(input) {
    const m = /\/presentation\/d\/([a-zA-Z0-9_-]+)/.exec(input);
    if (m)
        return m[1];
    return input;
}
export function presentationUrl(id) {
    return `https://docs.google.com/presentation/d/${id}/edit`;
}
//# sourceMappingURL=slides_client.js.map