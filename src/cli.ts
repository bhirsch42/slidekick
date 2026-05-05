#!/usr/bin/env node
import { watch } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { Command } from "commander";
import { AGENT_INSTRUCTIONS } from "./agent.js";
import { login, missingScopeHelp, tokenPath } from "./auth.js";
import { renderHtml } from "./html.js";
import { loadDeck } from "./load.js";
import {
  getClients,
  parsePresentationId,
  presentationUrl,
} from "./slides_client.js";
import { deckToTsx, presentationToDeck } from "./slides_reader.js";
import {
  deckToRequests,
  deleteAllSlidesRequests,
  presentationPageDims,
} from "./slides_writer.js";

const program = new Command();
program
  .name("slidekick")
  .description(
    "Author Google Slides decks as TSX. Push and pull from real presentations.",
  )
  .version("0.1.0");

const auth = program.command("auth").description("Authentication");

auth
  .command("login")
  .description("Run the OAuth flow and cache credentials")
  .action(async () => {
    try {
      await login();
    } catch (e) {
      console.error(`Auth failed: ${(e as Error).message}\n`);
      console.error(missingScopeHelp());
      process.exit(1);
    }
  });

auth
  .command("status")
  .description("Show whether credentials are cached")
  .action(async () => {
    try {
      await getClients();
      console.log(`Authenticated. Token cached at ${tokenPath()}.`);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Scaffold a new slidekick deck project")
  .argument("[dir]", "directory to create (defaults to current dir)")
  .action(async (dir?: string) => {
    const target = resolve(process.cwd(), dir ?? ".");
    await mkdir(target, { recursive: true });
    const deckPath = join(target, "deck.tsx");
    if (await fileExists(deckPath)) {
      console.error(`refusing to overwrite existing deck.tsx in ${target}`);
      process.exit(1);
    }
    await writeFile(deckPath, STARTER_DECK);
    await writeFile(join(target, "tsconfig.json"), STARTER_TSCONFIG);
    await writeFile(
      join(target, "package.json"),
      starterPackageJson(basename(target)),
    );
    await writeFile(join(target, ".gitignore"), STARTER_GITIGNORE);
    console.log(`scaffolded slidekick deck in ${target}`);
    console.log("");
    console.log("next:");
    console.log(`  cd ${dir ?? "."}`);
    console.log("  bun install");
    console.log("  slidekick auth login");
    console.log("  slidekick dev                            # local preview");
    console.log(
      '  slidekick new deck.tsx --title "My Deck" # create on Slides',
    );
  });

program
  .command("dev")
  .description("Start a local HTML preview while editing")
  .option("-p, --port <port>", "port to serve on", "5179")
  .option("-e, --entry <entry>", "deck entry file", "deck.tsx")
  .action(async (options: { port: string; entry: string }) => {
    const entry = resolve(process.cwd(), options.entry);
    const port = Number(options.port);
    if (!(await fileExists(entry))) {
      console.error(`deck entry not found: ${entry}`);
      console.error(`run \`slidekick init\` first, or pass --entry`);
      process.exit(1);
    }

    const sseControllers = new Set<
      ReadableStreamDefaultController<Uint8Array>
    >();
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
              connection: "keep-alive",
            },
          });
        }
        try {
          const deck = await loadDeck(entry);
          return new Response(renderHtml(deck), {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        } catch (err) {
          const stack =
            err instanceof Error ? (err.stack ?? err.message) : String(err);
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
        } catch {
          sseControllers.delete(c);
        }
      }
    });

    console.log(`slidekick dev: ${server.url.href}`);
    console.log(`watching ${watchDir}`);
  });

program
  .command("new")
  .description("Create a new Google Slides presentation from a deck file")
  .argument("<entry>", "deck entry file")
  .requiredOption("--title <title>", "title for the new presentation")
  .action(async (entry: string, opts: { title: string }) => {
    const entryPath = resolve(process.cwd(), entry);
    const deck = await loadDeck(entryPath);
    const { slides } = await getClients();

    const created = await slides.presentations.create({
      requestBody: {
        title: opts.title,
        pageSize: {
          width: { magnitude: 12192000, unit: "EMU" },
          height: { magnitude: 6858000, unit: "EMU" },
        },
      },
    });
    const id = created.data.presentationId;
    if (!id) throw new Error("Failed to create presentation");

    const deletes = deleteAllSlidesRequests(created.data);
    const writes = deckToRequests(deck, {
      page: presentationPageDims(created.data),
    });
    await slides.presentations.batchUpdate({
      presentationId: id,
      requestBody: { requests: [...deletes, ...writes] },
    });
    console.log(`${presentationUrl(id)}  (${opts.title})`);
  });

program
  .command("push")
  .description("Overwrite an existing Google Slides deck")
  .argument("<entry>", "deck entry file")
  .requiredOption("--id <id>", "target presentation ID or URL")
  .option("--dry-run", "print the batchUpdate requests, don't send")
  .action(async (entry: string, opts: { id: string; dryRun?: boolean }) => {
    const entryPath = resolve(process.cwd(), entry);
    const deck = await loadDeck(entryPath);
    const id = parsePresentationId(opts.id);

    if (opts.dryRun) {
      const reqs = deckToRequests(deck);
      console.log(JSON.stringify(reqs, null, 2));
      return;
    }

    const { slides } = await getClients();
    const existing = await slides.presentations.get({ presentationId: id });
    const deletes = deleteAllSlidesRequests(existing.data);
    const writes = deckToRequests(deck, {
      page: presentationPageDims(existing.data),
    });
    await slides.presentations.batchUpdate({
      presentationId: id,
      requestBody: { requests: [...deletes, ...writes] },
    });
    console.error(`Pushed ${entry} to ${presentationUrl(id)}`);
  });

program
  .command("pull")
  .description("Download a Google Slides deck and convert to TSX")
  .argument("<idOrUrl>", "presentation ID or URL")
  .option("-o, --output <file>", "write to file instead of stdout")
  .action(async (input: string, opts: { output?: string }) => {
    const id = parsePresentationId(input);
    const { slides } = await getClients();
    const res = await slides.presentations.get({ presentationId: id });
    const deck = presentationToDeck(res.data);
    const tsx = deckToTsx(deck);
    if (opts.output) {
      await writeFile(opts.output, tsx);
      console.error(`Wrote ${opts.output}`);
    } else {
      process.stdout.write(tsx);
    }
  });

program
  .command("agent")
  .description("Print agent-friendly instructions for authoring a deck")
  .action(() => {
    process.stdout.write(AGENT_INSTRUCTIONS);
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(`Error: ${(e as Error).message}`);
  if (/insufficient|invalid_scope|forbidden/i.test((e as Error).message)) {
    console.error(`\n${missingScopeHelp()}`);
  }
  process.exit(1);
});

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function makeSseStream(
  controllers: Set<ReadableStreamDefaultController<Uint8Array>>,
  encoder: TextEncoder,
): ReadableStream<Uint8Array> {
  let registered: ReadableStreamDefaultController<Uint8Array> | null = null;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      registered = controller;
      controllers.add(controller);
      controller.enqueue(encoder.encode(":\n\n"));
    },
    cancel() {
      if (registered) controllers.delete(registered);
    },
  });
}

function errorPage(stack: string): string {
  const escaped = stack.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c,
  );
  return `<!doctype html><html><body style="margin:0;background:#1a1a1a;color:#f55;font-family:ui-monospace,monospace">
<pre style="padding:24px;white-space:pre-wrap">${escaped}</pre>
<script>const sse=new EventSource("/sse");sse.onmessage=(e)=>{if(e.data==="reload")location.reload();};</script>
</body></html>`;
}

const STARTER_DECK = `import { Slide, Title, Subtitle, Bullets, Bullet } from "slidekick";

export default function deck() {
  return [
    <Slide>
      <Title>Hello, slidekick</Title>
      <Subtitle>Author decks as TSX. Push to Google Slides.</Subtitle>
    </Slide>,
    <Slide>
      <Title>Why slidekick</Title>
      <Bullets>
        <Bullet>Slides are code, diffable and reviewable</Bullet>
        <Bullet>An AI sidekick can author and revise them</Bullet>
        <Bullet>Pushed to a real Google Slides deck — fully editable</Bullet>
      </Bullets>
    </Slide>,
  ];
}
`;

const STARTER_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "jsxImportSource": "slidekick",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
`;

function starterPackageJson(name: string): string {
  const safeName = name.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "deck";
  return `{
  "name": "${safeName}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "slidekick dev"
  },
  "dependencies": {
    "slidekick": "github:bhirsch42/slidekick"
  }
}
`;
}

const STARTER_GITIGNORE = `node_modules
.DS_Store
`;
