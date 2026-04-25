import { watch } from "node:fs";
import { resolve, dirname } from "node:path";
import { access } from "node:fs/promises";
import { loadDeck } from "../render/load.js";
import { renderHtml } from "../render/html.js";
export async function devCommand(options) {
    const entry = resolve(process.cwd(), options.entry);
    const port = Number(options.port);
    if (!(await fileExists(entry))) {
        console.error(`deck entry not found: ${entry}`);
        console.error(`run \`slidekick init\` first, or pass --entry`);
        process.exit(1);
    }
    const sseControllers = new Set();
    const encoder = new TextEncoder();
    const server = Bun.serve({
        port,
        async fetch(req) {
            const url = new URL(req.url);
            if (url.pathname === "/sse") {
                const stream = makeSseStream(sseControllers, encoder);
                return new Response(stream, {
                    headers: {
                        "content-type": "text/event-stream",
                        "cache-control": "no-cache",
                        "connection": "keep-alive",
                    },
                });
            }
            try {
                const slides = await loadDeck(entry);
                const html = renderHtml(slides);
                return new Response(html, {
                    headers: { "content-type": "text/html; charset=utf-8" },
                });
            }
            catch (err) {
                const stack = err instanceof Error ? (err.stack ?? err.message) : String(err);
                return new Response(errorPage(stack), {
                    status: 500,
                    headers: { "content-type": "text/html; charset=utf-8" },
                });
            }
        },
    });
    const watchDir = dirname(entry);
    watch(watchDir, { recursive: true }, () => {
        const data = encoder.encode("data: reload\n\n");
        for (const c of sseControllers) {
            try {
                c.enqueue(data);
            }
            catch {
                sseControllers.delete(c);
            }
        }
    });
    console.log(`slidekick dev: ${server.url.href}`);
    console.log(`watching ${watchDir}`);
}
function makeSseStream(controllers, encoder) {
    let registered = null;
    return new ReadableStream({
        start(controller) {
            registered = controller;
            controllers.add(controller);
            controller.enqueue(encoder.encode(":\n\n"));
        },
        cancel() {
            if (registered)
                controllers.delete(registered);
        },
    });
}
function errorPage(stack) {
    const escaped = stack.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
    return `<!doctype html><html><body style="margin:0;background:#1a1a1a;color:#f55;font-family:ui-monospace,monospace">
<pre style="padding:24px;white-space:pre-wrap">${escaped}</pre>
<script>const sse=new EventSource("/sse");sse.onmessage=(e)=>{if(e.data==="reload")location.reload();};</script>
</body></html>`;
}
async function fileExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=dev.js.map