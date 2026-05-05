import type { Node } from "../types.js";
import { layoutDeck, SLIDE_W, SLIDE_H, type Placed } from "./layout.js";

const SCALE = 80;

export function renderHtml(slides: Node[]): string {
  const slidesHtml = layoutDeck(slides)
    .map((placed, i) => {
      const items = placed.map(placedToHtml).join("\n");
      const maxStep = placed.reduce((m, p) => Math.max(m, maxStepOf(p)), 0);
      return `<section class="slide" data-index="${i}" data-current-step="0" data-max-step="${maxStep}">${items}<div class="step-badge"></div></section>`;
    })
    .join("\n");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>slidekick preview</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #1a1a1a; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; padding: 24px; }
  .slide {
    position: relative;
    width: ${SLIDE_W * SCALE}px;
    height: ${SLIDE_H * SCALE}px;
    background: #fafafa;
    margin: 0 auto 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    color: #111;
    overflow: hidden;
    outline: 2px solid transparent;
    transition: outline-color 0.15s;
  }
  .slide.focused { outline-color: #4a9eff; }
  .placed { position: absolute; display: flex; flex-direction: column; }
  .role-title { font-size: 36px; font-weight: 700; justify-content: center; }
  .role-subtitle { font-size: 22px; color: #555; justify-content: center; }
  .role-heading { font-size: 22px; font-weight: 600; justify-content: center; }
  .role-text { font-size: 16px; }
  .role-quote { font-size: 22px; font-style: italic; text-align: center; justify-content: center; }
  .role-attribution { font-size: 14px; color: #666; text-align: center; justify-content: center; }
  .bullets { font-size: 18px; padding-left: 1.2em; margin: 0; list-style: disc; }
  .bullets li { margin: 0 0 6px 0; }
  img.placed { object-fit: contain; }
  .stepped-hidden { visibility: hidden; }
  .step-badge {
    position: absolute; right: 8px; bottom: 8px;
    font: 11px/1 ui-monospace, monospace;
    color: #888; background: rgba(255,255,255,0.85);
    padding: 3px 6px; border-radius: 3px;
    pointer-events: none;
  }
  .slide[data-max-step="0"] .step-badge { display: none; }
</style>
</head>
<body>
${slidesHtml}
<script>
  const slides = Array.from(document.querySelectorAll('.slide'));
  let focused = slides[0] ?? null;

  function applySteps(slide) {
    const cur = +slide.dataset.currentStep;
    slide.querySelectorAll('[data-step]').forEach((el) => {
      const st = +el.dataset.step;
      el.classList.toggle('stepped-hidden', st > cur);
    });
    const max = +slide.dataset.maxStep;
    const badge = slide.querySelector('.step-badge');
    if (badge) badge.textContent = max > 0 ? ('step ' + cur + ' / ' + max) : '';
  }

  function setFocused(s) {
    if (focused) focused.classList.remove('focused');
    focused = s;
    if (focused) focused.classList.add('focused');
  }

  slides.forEach((s) => {
    s.addEventListener('click', () => setFocused(s));
    applySteps(s);
  });
  if (focused) focused.classList.add('focused');

  document.addEventListener('keydown', (e) => {
    if (!focused) return;
    if (e.key === 'ArrowRight') {
      const cur = +focused.dataset.currentStep;
      const max = +focused.dataset.maxStep;
      if (cur < max) {
        focused.dataset.currentStep = String(cur + 1);
        applySteps(focused);
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft') {
      const cur = +focused.dataset.currentStep;
      if (cur > 0) {
        focused.dataset.currentStep = String(cur - 1);
        applySteps(focused);
        e.preventDefault();
      }
    } else if (e.key === '0') {
      focused.dataset.currentStep = '0';
      applySteps(focused);
    } else if (e.key === 'End') {
      focused.dataset.currentStep = focused.dataset.maxStep;
      applySteps(focused);
    }
  });

  const sse = new EventSource("/sse");
  sse.onmessage = (e) => { if (e.data === "reload") location.reload(); };
</script>
</body>
</html>`;
}

function maxStepOf(p: Placed): number {
  if (p.kind === "bullets") {
    return p.bullets.reduce((m, b) => Math.max(m, b.step), p.step);
  }
  return p.step;
}

function placedToHtml(p: Placed): string {
  const inset = `left:${p.x * SCALE}px;top:${p.y * SCALE}px;width:${p.w * SCALE}px;height:${p.h * SCALE}px`;
  if (p.kind === "image") {
    return `<img class="placed" data-step="${p.step}" src="${escapeAttr(p.src)}" alt="${escapeAttr(p.alt ?? "")}" style="${inset}">`;
  }
  if (p.kind === "bullets") {
    const lis = p.bullets
      .map((b) => `<li data-step="${b.step}">${escapeText(b.text)}</li>`)
      .join("");
    return `<ul class="placed bullets" data-step="${p.step}" style="${inset}">${lis}</ul>`;
  }
  return `<div class="placed role-${p.role}" data-step="${p.step}" style="${inset}">${escapeText(p.text)}</div>`;
}

function escapeText(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
