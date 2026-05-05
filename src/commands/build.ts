import { resolve, dirname } from "node:path";
import { access, mkdir } from "node:fs/promises";
import { loadDeck } from "../render/load.js";
import { renderPptx } from "../render/pptx.js";
import { renderImagePptx } from "../render/image-pptx.js";

interface BuildOptions {
  entry: string;
  out: string;
  imageMode?: boolean;
  imageWidth?: string;
}

export async function buildCommand(options: BuildOptions): Promise<void> {
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

  if (options.imageMode) {
    const widthPx = options.imageWidth ? parseInt(options.imageWidth, 10) : 1920;
    if (!Number.isFinite(widthPx) || widthPx < 320) {
      console.error(`--image-width must be an integer >= 320`);
      process.exit(1);
    }
    const stats = await renderImagePptx(slides, out, {
      widthPx,
      onFrame: (slideIndex, step, total) => {
        process.stdout.write(`\r  frame: slide ${slideIndex + 1}/${total}, step ${step}   `);
      },
    });
    process.stdout.write("\n");
    console.log(`wrote ${out} (${stats.frameCount} frames from ${stats.slideCount} slides at ${widthPx}px)`);
    return;
  }

  await renderPptx(slides, out);
  console.log(`wrote ${out}`);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
