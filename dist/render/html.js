import { layoutDeck, SLIDE_W, SLIDE_H } from "./layout.js";
const SCALE = 80;
export function renderHtml(slides) {
    const slidesHtml = layoutDeck(slides)
        .map((placed, i) => {
        const items = placed.map(placedToHtml).join("\n");
        return `<section class="slide" data-index="${i}">${items}</section>`;
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
  }
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
</style>
</head>
<body>
${slidesHtml}
<script>
  const sse = new EventSource("/sse");
  sse.onmessage = (e) => { if (e.data === "reload") location.reload(); };
</script>
</body>
</html>`;
}
function placedToHtml(p) {
    const inset = `left:${p.x * SCALE}px;top:${p.y * SCALE}px;width:${p.w * SCALE}px;height:${p.h * SCALE}px`;
    if (p.kind === "image") {
        return `<img class="placed" src="${escapeAttr(p.src)}" alt="${escapeAttr(p.alt ?? "")}" style="${inset}">`;
    }
    if (p.kind === "bullets") {
        const lis = p.bullets.map((b) => `<li>${escapeText(b)}</li>`).join("");
        return `<ul class="placed bullets" style="${inset}">${lis}</ul>`;
    }
    return `<div class="placed role-${p.role}" style="${inset}">${escapeText(p.text)}</div>`;
}
function escapeText(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}
function escapeAttr(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
//# sourceMappingURL=html.js.map