export function presentationToDeck(p) {
    const slides = p.slides ?? [];
    const pageW = p.pageSize?.width?.magnitude ?? 0;
    const pageH = p.pageSize?.height?.magnitude ?? 0;
    const theme = inferTheme(p);
    const slideNodes = slides.map((s) => slideToNode(s, pageW, pageH, theme));
    const result = { slides: slideNodes };
    if (Object.keys(theme).length > 0)
        result.theme = theme;
    warnEphemeralImageUrls(result);
    return result;
}
function isEphemeralUrl(url) {
    return /googleusercontent\.com\/(slidesz|presentation)/.test(url);
}
function warnEphemeralImageUrls(deck) {
    const urls = new Set();
    const visit = (children) => {
        for (const c of children) {
            if (c.kind === "image" && isEphemeralUrl(c.src))
                urls.add(c.src);
            else if (c.kind === "columns") {
                for (const col of c.children)
                    visit(col.children);
            }
        }
    };
    for (const s of deck.slides) {
        visit(s.children);
        if (s.background &&
            typeof s.background !== "string" &&
            isEphemeralUrl(s.background.image)) {
            urls.add(s.background.image);
        }
    }
    if (urls.size > 0) {
        console.warn(`slidekick: ${urls.size} image URL(s) are short-lived Google CDN links (googleusercontent.com/slidesz/...) that will expire within hours. Pushing this TSX back later may produce broken images. Replace with stable source URLs before re-pushing.`);
    }
}
function slideToNode(slide, pageW, pageH, theme) {
    const elements = (slide.pageElements ?? [])
        .slice()
        .sort((a, b) => yOf(a) - yOf(b));
    let background;
    const contentEls = [];
    for (const el of elements) {
        if (isFullPageImage(el, pageW, pageH)) {
            const url = el.image?.sourceUrl ?? el.image?.contentUrl;
            if (url && background === undefined) {
                background = { image: url };
                continue;
            }
        }
        contentEls.push(el);
    }
    const bgFill = slide.pageProperties?.pageBackgroundFill;
    if (background === undefined && bgFill) {
        const rgb = bgFill.solidFill?.color?.rgbColor;
        if (rgb) {
            const hex = rgbToHex(rgb);
            if (hex && hex !== theme.background)
                background = hex;
        }
        else if (bgFill.stretchedPictureFill?.contentUrl) {
            background = { image: bgFill.stretchedPictureFill.contentUrl };
        }
    }
    const children = [];
    for (const row of groupRows(contentEls)) {
        if (row.length === 1) {
            const child = elementToChild(row[0]);
            if (child)
                children.push(child);
            continue;
        }
        const sorted = row.slice().sort((a, b) => boundsOf(a).x - boundsOf(b).x);
        const cols = [];
        for (const el of sorted) {
            const child = elementToChild(el);
            if (child)
                cols.push({ kind: "column", children: [child] });
        }
        if (cols.length > 1) {
            children.push({ kind: "columns", children: cols });
        }
        else if (cols.length === 1) {
            children.push(...cols[0].children);
        }
    }
    const node = { kind: "slide", children };
    if (background !== undefined)
        node.background = background;
    return node;
}
function isFullPageImage(el, pageW, pageH) {
    if (!el.image)
        return false;
    if (pageW <= 0 || pageH <= 0)
        return false;
    const w = el.size?.width?.magnitude;
    const h = el.size?.height?.magnitude;
    const sx = el.transform?.scaleX ?? 1;
    const sy = el.transform?.scaleY ?? 1;
    const tx = el.transform?.translateX ?? 0;
    const ty = el.transform?.translateY ?? 0;
    if (!w || !h)
        return false;
    const rw = w * sx;
    const rh = h * sy;
    const tol = 0.02;
    if (Math.abs(tx) > pageW * tol)
        return false;
    if (Math.abs(ty) > pageH * tol)
        return false;
    if (Math.abs(rw - pageW) > pageW * tol)
        return false;
    if (Math.abs(rh - pageH) > pageH * tol)
        return false;
    return true;
}
function yOf(el) {
    return el.transform?.translateY ?? 0;
}
function boundsOf(el) {
    const sx = el.transform?.scaleX ?? 1;
    const sy = el.transform?.scaleY ?? 1;
    const tx = el.transform?.translateX ?? 0;
    const ty = el.transform?.translateY ?? 0;
    const w = (el.size?.width?.magnitude ?? 0) * sx;
    const h = (el.size?.height?.magnitude ?? 0) * sy;
    return { x: tx, y: ty, w, h };
}
function groupRows(els) {
    const sorted = els.slice().sort((a, b) => yOf(a) - yOf(b));
    const rows = [];
    for (const el of sorted) {
        const b = boundsOf(el);
        const last = rows[rows.length - 1];
        if (last && shouldJoinRow(last, b)) {
            last.push(el);
        }
        else {
            rows.push([el]);
        }
    }
    return rows;
}
function shouldJoinRow(row, b) {
    for (const m of row) {
        const mb = boundsOf(m);
        const vOverlap = Math.min(mb.y + mb.h, b.y + b.h) - Math.max(mb.y, b.y);
        const minH = Math.min(mb.h, b.h);
        if (minH <= 0 || vOverlap / minH < 0.5)
            return false;
        const hOverlap = Math.min(mb.x + mb.w, b.x + b.w) - Math.max(mb.x, b.x);
        if (hOverlap > Math.min(mb.w, b.w) * 0.1)
            return false;
    }
    return true;
}
function elementToChild(el) {
    if (el.image?.contentUrl || el.image?.sourceUrl) {
        const node = {
            kind: "image",
            src: el.image.sourceUrl ?? el.image.contentUrl ?? "",
        };
        return node;
    }
    if (!el.shape?.text)
        return null;
    const paragraphs = parseParagraphs(el.shape.text);
    if (paragraphs.length === 0)
        return null;
    const allBullets = paragraphs.every((p) => p.bullet);
    if (allBullets && paragraphs.length > 0) {
        const bullets = paragraphs.map((p) => ({
            kind: "bullet",
            runs: collapseRuns(p.runs, p.dominant),
        }));
        const node = { kind: "bullets", children: bullets };
        return node;
    }
    const allRuns = [];
    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        allRuns.push(...p.runs);
        if (i < paragraphs.length - 1)
            allRuns.push({ text: "\n" });
    }
    const dominant = paragraphs[0].dominant;
    const runs = collapseRuns(allRuns, dominant);
    const text = runs.map((r) => r.text).join("");
    if (!text.trim())
        return null;
    const role = classifyText(dominant);
    switch (role) {
        case "title":
            return { kind: "title", runs };
        case "subtitle":
            return { kind: "subtitle", runs };
        case "heading":
            return { kind: "heading", runs };
        default:
            return { kind: "text", runs };
    }
}
function parseParagraphs(text) {
    const elements = text.textElements ?? [];
    const paragraphs = [];
    let currentRuns = [];
    let currentBullet = false;
    let dominant = {};
    function flush() {
        if (currentRuns.length === 0)
            return;
        paragraphs.push({ bullet: currentBullet, runs: currentRuns, dominant });
        currentRuns = [];
        dominant = {};
    }
    for (const e of elements) {
        if (e.paragraphMarker) {
            flush();
            currentBullet = !!e.paragraphMarker.bullet;
        }
        else if (e.textRun) {
            const content = e.textRun.content ?? "";
            const raw = textRunStyle(e.textRun.style ?? {});
            if (Object.keys(dominant).length === 0)
                dominant = raw;
            const lines = content.split("\n");
            lines.forEach((line, i) => {
                if (line.length > 0) {
                    currentRuns.push(toRun(line, raw));
                }
                if (i < lines.length - 1) {
                    flush();
                }
            });
        }
    }
    flush();
    return paragraphs.filter((p) => p.runs.some((r) => r.text.length > 0));
}
function textRunStyle(style) {
    const out = {};
    if (style.fontSize?.magnitude)
        out.fontSize = style.fontSize.magnitude;
    if (style.bold)
        out.bold = true;
    if (style.italic)
        out.italic = true;
    if (style.fontFamily)
        out.fontFamily = style.fontFamily;
    const rgb = style.foregroundColor?.opaqueColor?.rgbColor;
    if (rgb) {
        const hex = rgbToHex(rgb);
        if (hex)
            out.color = hex;
    }
    return out;
}
function toRun(text, raw) {
    const style = {};
    if (raw.fontSize !== undefined)
        style.size = raw.fontSize;
    if (raw.bold)
        style.weight = 700;
    if (raw.italic)
        style.italic = true;
    if (raw.fontFamily)
        style.font = raw.fontFamily;
    if (raw.color)
        style.color = raw.color;
    if (Object.keys(style).length === 0)
        return { text };
    return { text, style };
}
function collapseRuns(runs, dominant) {
    const out = [];
    for (const r of runs) {
        const filtered = filterToOverrides(r.style, dominant);
        const stripped = filtered
            ? { text: r.text, style: filtered }
            : { text: r.text };
        const last = out[out.length - 1];
        if (last && sameStyle(last.style, stripped.style)) {
            last.text += stripped.text;
        }
        else {
            out.push(stripped);
        }
    }
    return out;
}
function filterToOverrides(style, dominant) {
    if (!style)
        return undefined;
    const out = {};
    if (style.size !== undefined && style.size !== dominant.fontSize)
        out.size = style.size;
    if (style.weight !== undefined && (style.weight === 700) !== !!dominant.bold)
        out.weight = style.weight;
    if (style.italic !== undefined && !!style.italic !== !!dominant.italic)
        out.italic = style.italic;
    if (style.font !== undefined && style.font !== dominant.fontFamily)
        out.font = style.font;
    if (style.color !== undefined && style.color !== dominant.color)
        out.color = style.color;
    return Object.keys(out).length === 0 ? undefined : out;
}
function sameStyle(a, b) {
    if (!a && !b)
        return true;
    if (!a || !b)
        return false;
    return (a.size === b.size &&
        a.weight === b.weight &&
        a.italic === b.italic &&
        a.font === b.font &&
        a.color === b.color);
}
function classifyText(style) {
    const size = style.fontSize ?? 14;
    if (style.bold && size >= 30)
        return "title";
    if (style.bold)
        return "heading";
    if (size >= 20)
        return "subtitle";
    return "text";
}
function rgbToHex(rgb) {
    const r = Math.round((rgb.red ?? 0) * 255);
    const g = Math.round((rgb.green ?? 0) * 255);
    const b = Math.round((rgb.blue ?? 0) * 255);
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function inferTheme(p) {
    const theme = {};
    const masterBg = (p.masters ?? [])
        .map((m) => m.pageProperties?.pageBackgroundFill?.solidFill?.color?.rgbColor)
        .find((c) => c !== undefined);
    if (masterBg) {
        const hex = rgbToHex(masterBg);
        if (hex)
            theme.background = hex;
    }
    const colors = [];
    const fonts = [];
    for (const slide of p.slides ?? []) {
        for (const el of slide.pageElements ?? []) {
            const els = el.shape?.text?.textElements ?? [];
            for (const e of els) {
                const s = e.textRun?.style;
                if (!s)
                    continue;
                const rgb = s.foregroundColor?.opaqueColor?.rgbColor;
                if (rgb) {
                    const hex = rgbToHex(rgb);
                    if (hex)
                        colors.push(hex);
                }
                if (s.fontFamily)
                    fonts.push(s.fontFamily);
            }
        }
    }
    const modeColor = mode(colors);
    if (modeColor)
        theme.text = modeColor;
    const modeFont = mode(fonts);
    if (modeFont)
        theme.fonts = { body: modeFont };
    return theme;
}
function mode(arr) {
    if (arr.length === 0)
        return undefined;
    const counts = new Map();
    for (const v of arr)
        counts.set(v, (counts.get(v) ?? 0) + 1);
    let best;
    let bestCount = 0;
    for (const [v, c] of counts) {
        if (c > bestCount) {
            best = v;
            bestCount = c;
        }
    }
    return best;
}
export function deckToTsx(deck) {
    const used = new Set(["Slide"]);
    const slidesSrc = deck.slides
        .map((s) => renderSlide(s, used))
        .join(",\n    ");
    const themeSrc = deck.theme && Object.keys(deck.theme).length > 0
        ? `const theme = ${stringifyTheme(deck.theme)};\n\n`
        : "";
    const returnExpr = deck.theme && Object.keys(deck.theme).length > 0
        ? `{ theme, slides: [\n    ${slidesSrc},\n  ] }`
        : `[\n    ${slidesSrc},\n  ]`;
    const imports = Array.from(used).sort().join(", ");
    return `import { ${imports} } from "slidekick";

export default function deck() {
  ${themeSrc.trim()}${themeSrc ? "\n\n  " : ""}return ${returnExpr};
}
`;
}
function stringifyTheme(theme) {
    return JSON.stringify(theme, null, 2).replace(/\n/g, "\n  ");
}
function renderSlide(slide, used) {
    const props = [];
    if (slide.background !== undefined) {
        if (typeof slide.background === "string") {
            props.push(` background=${JSON.stringify(slide.background)}`);
        }
        else {
            props.push(` background={{ image: ${JSON.stringify(slide.background.image)} }}`);
        }
    }
    if (slide.align)
        props.push(` align=${JSON.stringify(slide.align)}`);
    const open = `<Slide${props.join("")}>`;
    if (slide.children.length === 0) {
        return `<Slide${props.join("")} />`;
    }
    const body = slide.children
        .map((c) => renderChild(c, used, "      "))
        .join("\n");
    return `${open}\n${body}\n    </Slide>`;
}
function renderChild(node, used, indent) {
    switch (node.kind) {
        case "title":
            used.add("Title");
            return `${indent}<Title>${renderRuns(node.runs, used)}</Title>`;
        case "subtitle":
            used.add("Subtitle");
            return `${indent}<Subtitle>${renderRuns(node.runs, used)}</Subtitle>`;
        case "heading":
            used.add("Heading");
            return `${indent}<Heading>${renderRuns(node.runs, used)}</Heading>`;
        case "text":
            used.add("Text");
            return `${indent}<Text>${renderRuns(node.runs, used)}</Text>`;
        case "image": {
            used.add("Image");
            const alt = node.alt ? ` alt=${JSON.stringify(node.alt)}` : "";
            const fit = node.fit && node.fit !== "contain"
                ? ` fit=${JSON.stringify(node.fit)}`
                : "";
            return `${indent}<Image src=${JSON.stringify(node.src)}${alt}${fit} />`;
        }
        case "bullets": {
            used.add("Bullets");
            used.add("Bullet");
            const items = node.children
                .map((b) => `${indent}  <Bullet>${renderRuns(b.runs, used)}</Bullet>`)
                .join("\n");
            return `${indent}<Bullets>\n${items}\n${indent}</Bullets>`;
        }
        case "columns": {
            used.add("Columns");
            used.add("Column");
            const cols = node.children
                .map((c) => {
                const inner = c.children
                    .map((cc) => renderChild(cc, used, `${indent}    `))
                    .join("\n");
                const w = c.weight ? ` weight={${c.weight}}` : "";
                return `${indent}  <Column${w}>\n${inner}\n${indent}  </Column>`;
            })
                .join("\n");
            return `${indent}<Columns>\n${cols}\n${indent}</Columns>`;
        }
    }
}
function renderRuns(runs, used) {
    return runs
        .map((r) => {
        const text = escapeJsxText(r.text);
        if (!r.style)
            return text;
        used.add("Span");
        const attrs = [];
        if (r.style.size !== undefined) {
            attrs.push(typeof r.style.size === "number"
                ? `size={${r.style.size}}`
                : `size=${JSON.stringify(r.style.size)}`);
        }
        if (r.style.weight !== undefined)
            attrs.push(`weight={${r.style.weight}}`);
        if (r.style.italic)
            attrs.push(`italic`);
        if (r.style.font)
            attrs.push(`font=${JSON.stringify(r.style.font)}`);
        if (r.style.color)
            attrs.push(`color=${JSON.stringify(r.style.color)}`);
        return `<Span ${attrs.join(" ")}>${text}</Span>`;
    })
        .join("");
}
function escapeJsxText(s) {
    return s.replace(/[{}<>\n]/g, (c) => `{${JSON.stringify(c)}}`);
}
//# sourceMappingURL=slides_reader.js.map