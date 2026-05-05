import {
  layoutDeck,
  type Placed,
  SLIDE_H,
  SLIDE_W,
  type SlideLayout,
} from "./layout.js";
import type {
  Background,
  Color,
  DeckInput,
  Run,
  RunStyle,
  SizeToken,
  TextRole,
  Theme,
} from "./types.js";

const SCALE = 80;

interface RoleStyle {
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
}

const ROLE_STYLES: Record<TextRole, RoleStyle> = {
  title: { fontSize: 36, bold: true },
  subtitle: { fontSize: 22 },
  heading: { fontSize: 22, bold: true },
  text: { fontSize: 16 },
  bullet: { fontSize: 18 },
};

const TEXT_ALIGN: Record<string, string> = {
  start: "left",
  center: "center",
  end: "right",
};

const SIZE_TOKENS: Record<SizeToken, number> = { sm: 0.85, md: 1.0, lg: 1.25 };

function normalize(input: DeckInput): { theme: Theme; slides: SlideLayout[] } {
  if (Array.isArray(input)) return { theme: {}, slides: layoutDeck(input) };
  return { theme: input.theme ?? {}, slides: layoutDeck(input.slides) };
}

export function renderHtml(input: DeckInput): string {
  const { theme, slides } = normalize(input);
  const slidesHtml = slides
    .map((slideLayout, i) => {
      const items = slideLayout.placed
        .map((p) => placedToHtml(p, theme))
        .join("\n");
      const bg = slideLayout.background ?? theme.background;
      const bgStyle = bgToCss(bg);
      const scrim = scrimDiv(bg);
      const themeText = theme.text ? `color:${escapeAttr(theme.text)};` : "";
      const themeFont = theme.fonts?.body
        ? `font-family:${escapeAttr(theme.fonts.body)};`
        : "";
      return `<section class="slide" data-index="${i}" style="${bgStyle}${themeText}${themeFont}">${scrim}${items}</section>`;
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
    background-size: cover;
    background-position: center;
  }
  .slide.focused { outline-color: #4a9eff; }
  .scrim { position: absolute; inset: 0; pointer-events: none; }
  .placed { position: absolute; display: flex; flex-direction: column; }
  .role-title { font-size: 36px; font-weight: 700; justify-content: center; }
  .role-subtitle { font-size: 22px; justify-content: center; }
  .role-heading { font-size: 22px; font-weight: 600; justify-content: center; }
  .role-text { font-size: 16px; }
  .role-bullet { font-size: 18px; }
  .bullets { font-size: 18px; padding-left: 1.2em; margin: 0; list-style: disc; }
  .bullets li { margin: 0 0 6px 0; }
  img.placed { object-fit: contain; }
  img.fit-cover { object-fit: cover; }
  img.fit-fill { object-fit: fill; }
</style>
</head>
<body>
${slidesHtml}
<script>
  const slides = Array.from(document.querySelectorAll('.slide'));
  let focused = slides[0] ?? null;

  function setFocused(s) {
    if (focused) focused.classList.remove('focused');
    focused = s;
    if (focused) focused.classList.add('focused');
  }

  slides.forEach((s) => {
    s.addEventListener('click', () => setFocused(s));
  });
  if (focused) focused.classList.add('focused');

  const sse = new EventSource("/sse");
  sse.onmessage = (e) => { if (e.data === "reload") location.reload(); };
</script>
</body>
</html>`;
}

function bgToCss(bg: Background | undefined): string {
  if (bg === undefined) return "";
  if (typeof bg === "string") return `background-color:${escapeAttr(bg)};`;
  return `background-image:url(${JSON.stringify(bg.image)});`;
}

function scrimDiv(bg: Background | undefined): string {
  if (typeof bg !== "object" || bg === null || bg.scrim === undefined)
    return "";
  const color =
    typeof bg.scrim === "number"
      ? `rgba(0,0,0,${Math.max(0, Math.min(1, bg.scrim))})`
      : bg.scrim;
  return `<div class="scrim" style="background:${escapeAttr(color)};"></div>`;
}

function placedToHtml(p: Placed, theme: Theme): string {
  const inset = `left:${p.x * SCALE}px;top:${p.y * SCALE}px;width:${p.w * SCALE}px;height:${p.h * SCALE}px`;
  if (p.kind === "image") {
    const fitClass =
      p.fit === "cover" ? " fit-cover" : p.fit === "fill" ? " fit-fill" : "";
    return `<img class="placed${fitClass}" src="${escapeAttr(p.src)}" alt="${escapeAttr(p.alt ?? "")}" style="${inset}">`;
  }
  if (p.kind === "bullets") {
    const lis = p.bullets
      .map((b) => {
        const a =
          b.align && TEXT_ALIGN[b.align]
            ? `text-align:${TEXT_ALIGN[b.align]};`
            : "";
        return `<li style="${a}">${runsToHtml(b.runs, "bullet", theme)}</li>`;
      })
      .join("");
    return `<ul class="placed bullets" style="${inset}">${lis}</ul>`;
  }
  const ta =
    p.align && TEXT_ALIGN[p.align] ? `text-align:${TEXT_ALIGN[p.align]};` : "";
  return `<div class="placed role-${p.role}" style="${inset}${ta}">${runsToHtml(p.runs, p.role, theme)}</div>`;
}

function runsToHtml(runs: Run[], role: TextRole, theme: Theme): string {
  return runs
    .map((r) => {
      const text = escapeText(r.text).replace(/\n/g, "<br/>");
      const css = runStyleCss(r.style, role, theme);
      if (!css) return text;
      return `<span style="${css}">${text}</span>`;
    })
    .join("");
}

function runStyleCss(
  style: RunStyle | undefined,
  role: TextRole,
  theme: Theme,
): string {
  if (!style) return "";
  const parts: string[] = [];
  const base = ROLE_STYLES[role].fontSize;
  let size: number | undefined;
  if (style.size !== undefined) {
    size =
      typeof style.size === "number"
        ? style.size
        : base * SIZE_TOKENS[style.size];
  }
  if (style.cite) {
    size = (size ?? base) * 0.75;
  }
  if (size !== undefined) parts.push(`font-size:${size}px`);
  if (style.weight !== undefined) parts.push(`font-weight:${style.weight}`);
  if (style.italic) parts.push(`font-style:italic`);
  if (style.font) parts.push(`font-family:${style.font}`);
  let color: Color | undefined = style.color;
  if (style.cite && !color && theme.accent) color = theme.accent;
  if (color) parts.push(`color:${color}`);
  return parts.join(";");
}

function escapeText(s: string): string {
  return s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c,
  );
}

function escapeAttr(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}
