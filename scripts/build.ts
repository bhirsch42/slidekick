#!/usr/bin/env bun
import { $ } from "bun";
import { rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });

console.log("tsc — emitting library + .d.ts");
await $`tsc`;

console.log("bun build — bundling CLI");
const result = await Bun.build({
  entrypoints: ["src/cli.ts"],
  outdir: "dist",
  target: "bun",
  external: ["pptxgenjs", "puppeteer"],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const cliPath = "dist/cli.js";
const original = await Bun.file(cliPath).text();
const withBunShebang = original.replace(/^#![^\n]*\n/, "#!/usr/bin/env bun\n");
await Bun.write(cliPath, withBunShebang);

await $`chmod +x ${cliPath}`;
console.log("done.");
