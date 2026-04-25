import { resolve, dirname } from "node:path";
import { access, mkdir } from "node:fs/promises";
import { loadDeck } from "../render/load.js";
import { renderPptx } from "../render/pptx.js";
export async function buildCommand(options) {
    const entry = resolve(process.cwd(), options.entry);
    const out = resolve(process.cwd(), options.out);
    if (!(await fileExists(entry))) {
        console.error(`deck entry not found: ${entry}`);
        console.error(`run \`slidekick init\` first, or pass --entry`);
        process.exit(1);
    }
    await mkdir(dirname(out), { recursive: true });
    console.log(`loading ${entry}`);
    const slides = await loadDeck(entry);
    console.log(`rendering ${slides.length} slide${slides.length === 1 ? "" : "s"}`);
    await renderPptx(slides, out);
    console.log(`wrote ${out}`);
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
//# sourceMappingURL=build.js.map