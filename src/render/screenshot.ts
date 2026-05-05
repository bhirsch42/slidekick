import { SLIDE_W, SLIDE_H, type Placed } from "./layout.js";

export const BASE_SCALE = 80;

export function maxStepOf(placed: Placed[]): number {
  let m = 0;
  for (const p of placed) {
    m = Math.max(m, p.step);
    if (p.kind === "bullets") for (const b of p.bullets) m = Math.max(m, b.step);
  }
  return m;
}

export function renderSlideStill(placed: Placed[], currentStep: number): string {
  const items = placed
    .filter((p) => p.step <= currentStep)
    .map((p) => placedToHtml(p, currentStep))
    .join("\n");
  const w = Math.round(SLIDE_W * BASE_SCALE);
  const h = Math.round(SLIDE_H * BASE_SCALE);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: ${w}px; height: ${h}px; background: #fafafa; color: #111; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; overflow: hidden; }
  .placed { position: absolute; display: flex; flex-direction: column; }
  .role-title { font-size: 36px; font-weight: 700; justify-content: center; }
  .role-subtitle { font-size: 22px; color: #555; justify-content: center; }
  .role-heading { font-size: 22px; font-weight: 600; justify-content: center; }
  .role-text { font-size: 16px; }
  .role-quote { font-size: 22px; font-style: italic; text-align: center; justify-content: center; }
  .role-attribution { font-size: 14px; color: #666; text-align: center; justify-content: center; }
  .bullets { font-size: 18px; padding-left: 1.2em; margin: 0; list-style: disc; }
  .bullets li { margin: 0 0 6px 0; }
  .bullets li.hidden { visibility: hidden; }
  img.placed { object-fit: contain; }
</style>
</head>
<body>
${items}
</body>
</html>`;
}

function placedToHtml(p: Placed, currentStep: number): string {
  const inset = `left:${p.x * BASE_SCALE}px;top:${p.y * BASE_SCALE}px;width:${p.w * BASE_SCALE}px;height:${p.h * BASE_SCALE}px`;
  if (p.kind === "image") {
    return `<img class="placed" src="${escapeAttr(p.src)}" alt="${escapeAttr(p.alt ?? "")}" style="${inset}">`;
  }
  if (p.kind === "bullets") {
    const lis = p.bullets
      .map((b) => {
        const cls = b.step > currentStep ? "hidden" : "";
        return `<li class="${cls}">${escapeText(b.text)}</li>`;
      })
      .join("");
    return `<ul class="placed bullets" style="${inset}">${lis}</ul>`;
  }
  return `<div class="placed role-${p.role}" style="${inset}">${escapeText(p.text)}</div>`;
}

function escapeText(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
