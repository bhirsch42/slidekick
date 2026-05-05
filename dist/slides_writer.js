import { layoutDeck, SLIDE_H, SLIDE_W } from "./layout.js";
export const DEFAULT_PAGE = { widthPt: SLIDE_W * 72, heightPt: SLIDE_H * 72 };
const DEFAULT_ROLE_STYLE = {
    title: { fontSize: 36, bold: true },
    subtitle: { fontSize: 22 },
    heading: { fontSize: 22, bold: true },
    text: { fontSize: 16 },
    bullet: { fontSize: 18 },
};
const PARAGRAPH_ALIGN = {
    start: "START",
    center: "CENTER",
    end: "END",
};
const SIZE_TOKENS = { sm: 0.85, md: 1.0, lg: 1.25 };
function normalizeDeck(input) {
    if (Array.isArray(input))
        return { theme: {}, slides: input };
    return { theme: input.theme ?? {}, slides: input.slides };
}
export function deckToRequests(input, opts = {}) {
    const { theme, slides } = normalizeDeck(input);
    const page = opts.page ?? DEFAULT_PAGE;
    const sx = page.widthPt / SLIDE_W;
    const sy = page.heightPt / SLIDE_H;
    const layouts = layoutDeck(slides);
    const requests = [];
    layouts.forEach((slideLayout, slideIdx) => {
        const slideId = `sk_s_${slideIdx}`;
        requests.push({
            createSlide: {
                objectId: slideId,
                slideLayoutReference: { predefinedLayout: "BLANK" },
            },
        });
        const bg = slideLayout.background ?? theme.background;
        if (bg !== undefined)
            emitPageBackground(requests, slideId, bg);
        if (typeof bg === "object" && bg !== null && bg.scrim !== undefined) {
            emitScrim(requests, slideId, slideIdx, bg.scrim, page);
        }
        slideLayout.placed.forEach((p, i) => {
            const elementId = `sk_e_${slideIdx}_${i}`;
            const x = p.x * sx;
            const y = p.y * sy;
            const w = p.w * sx;
            const h = p.h * sy;
            emitElement(requests, slideId, elementId, p, x, y, w, h, theme);
        });
    });
    return requests;
}
function emitPageBackground(out, slideId, bg) {
    if (typeof bg === "string") {
        const color = parseColor(bg);
        if (!color)
            return;
        out.push({
            updatePageProperties: {
                objectId: slideId,
                pageProperties: {
                    pageBackgroundFill: {
                        solidFill: { color: { rgbColor: color }, alpha: 1 },
                    },
                },
                fields: "pageBackgroundFill.solidFill.color,pageBackgroundFill.solidFill.alpha",
            },
        });
        return;
    }
    out.push({
        updatePageProperties: {
            objectId: slideId,
            pageProperties: {
                pageBackgroundFill: {
                    stretchedPictureFill: { contentUrl: bg.image },
                },
            },
            fields: "pageBackgroundFill.stretchedPictureFill.contentUrl",
        },
    });
}
function emitElement(out, slideId, elementId, p, x, y, w, h, theme) {
    const elementProperties = {
        pageObjectId: slideId,
        size: {
            width: { magnitude: w, unit: "PT" },
            height: { magnitude: h, unit: "PT" },
        },
        transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: "PT" },
    };
    if (p.kind === "image") {
        out.push({ createImage: { objectId: elementId, url: p.src, elementProperties } });
        if (p.crop)
            emitCrop(out, elementId, p.crop);
        return;
    }
    out.push({
        createShape: { objectId: elementId, shapeType: "TEXT_BOX", elementProperties },
    });
    if (p.kind === "text") {
        emitRuns(out, elementId, p.runs, p.role, theme, p.align);
        return;
    }
    // bullets
    emitBullets(out, elementId, p.bullets, theme);
}
function emitRuns(out, elementId, runs, role, theme, paragraphAlign) {
    const text = runs.map((r) => r.text).join("");
    if (text.length === 0)
        return;
    out.push({ insertText: { objectId: elementId, text, insertionIndex: 0 } });
    if (paragraphAlign && PARAGRAPH_ALIGN[paragraphAlign]) {
        out.push({
            updateParagraphStyle: {
                objectId: elementId,
                style: { alignment: PARAGRAPH_ALIGN[paragraphAlign] },
                fields: "alignment",
                textRange: { type: "ALL" },
            },
        });
    }
    let cursor = 0;
    for (const run of runs) {
        const len = run.text.length;
        if (len > 0) {
            const merged = mergeStyles(role, theme, run.style);
            pushTextStyle(out, elementId, merged, cursor, cursor + len);
        }
        cursor += len;
    }
}
function emitBullets(out, elementId, bullets, theme) {
    const lineTexts = bullets.map((b) => b.runs.map((r) => r.text).join(""));
    const text = lineTexts.join("\n");
    if (text.length === 0)
        return;
    out.push({ insertText: { objectId: elementId, text, insertionIndex: 0 } });
    let cursor = 0;
    for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        const lineLen = lineTexts[i].length;
        if (b.align && PARAGRAPH_ALIGN[b.align]) {
            out.push({
                updateParagraphStyle: {
                    objectId: elementId,
                    style: { alignment: PARAGRAPH_ALIGN[b.align] },
                    fields: "alignment",
                    textRange: { type: "FIXED_RANGE", startIndex: cursor, endIndex: cursor + lineLen },
                },
            });
        }
        for (const run of b.runs) {
            const len = run.text.length;
            if (len > 0) {
                const merged = mergeStyles("bullet", theme, run.style);
                pushTextStyle(out, elementId, merged, cursor, cursor + len);
            }
            cursor += len;
        }
        if (i < bullets.length - 1)
            cursor += 1;
    }
    out.push({
        createParagraphBullets: {
            objectId: elementId,
            textRange: { type: "ALL" },
            bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
    });
}
function roleBaseStyle(role, theme) {
    const base = DEFAULT_ROLE_STYLE[role];
    const sizeOverride = theme.sizes?.[role];
    return { ...base, fontSize: sizeOverride ?? base.fontSize };
}
function mergeStyles(role, theme, run) {
    const base = roleBaseStyle(role, theme);
    const isDisplay = role === "title" || role === "heading";
    const themeFont = isDisplay
        ? theme.fonts?.display ?? theme.fonts?.body
        : theme.fonts?.body;
    const themeColor = theme.text;
    let fontSize = base.fontSize;
    let bold = !!base.bold;
    let italic = !!base.italic;
    let font = themeFont;
    let color = themeColor;
    if (run) {
        if (run.size !== undefined) {
            fontSize = resolveSize(run.size, base.fontSize);
        }
        if (run.weight !== undefined)
            bold = run.weight >= 700;
        if (run.italic !== undefined)
            italic = run.italic;
        if (run.font !== undefined)
            font = run.font;
        if (run.color !== undefined)
            color = run.color;
        if (run.cite) {
            fontSize = fontSize * 0.75;
            if (run.color === undefined && theme.accent)
                color = theme.accent;
        }
    }
    return { fontSize, bold, italic, font, color };
}
function resolveSize(size, base) {
    if (typeof size === "number")
        return size;
    const factor = SIZE_TOKENS[size];
    return base * factor;
}
function pushTextStyle(out, objectId, style, startIndex, endIndex) {
    const fields = ["fontSize", "bold", "italic"];
    const textStyle = {
        fontSize: { magnitude: style.fontSize, unit: "PT" },
        bold: style.bold,
        italic: style.italic,
    };
    if (style.font) {
        textStyle.fontFamily = style.font;
        fields.push("fontFamily");
    }
    if (style.color) {
        const rgb = parseColor(style.color);
        if (rgb) {
            textStyle.foregroundColor = { opaqueColor: { rgbColor: rgb } };
            fields.push("foregroundColor");
        }
    }
    out.push({
        updateTextStyle: {
            objectId,
            style: textStyle,
            fields: fields.join(","),
            textRange: { type: "FIXED_RANGE", startIndex, endIndex },
        },
    });
}
function emitScrim(out, slideId, slideIdx, scrim, page) {
    const objectId = `sk_scrim_${slideIdx}`;
    let rgb = null;
    let alpha = 1;
    if (typeof scrim === "number") {
        rgb = { red: 0, green: 0, blue: 0 };
        alpha = Math.max(0, Math.min(1, scrim));
    }
    else {
        rgb = parseColor(scrim);
    }
    if (!rgb)
        return;
    out.push({
        createShape: {
            objectId,
            shapeType: "RECTANGLE",
            elementProperties: {
                pageObjectId: slideId,
                size: {
                    width: { magnitude: page.widthPt, unit: "PT" },
                    height: { magnitude: page.heightPt, unit: "PT" },
                },
                transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "PT" },
            },
        },
    });
    out.push({
        updateShapeProperties: {
            objectId,
            shapeProperties: {
                shapeBackgroundFill: { solidFill: { color: { rgbColor: rgb }, alpha } },
                outline: { propertyState: "NOT_RENDERED" },
            },
            fields: "shapeBackgroundFill.solidFill,outline.propertyState",
        },
    });
}
function emitCrop(out, objectId, crop) {
    out.push({
        updateImageProperties: {
            objectId,
            imageProperties: {
                cropProperties: {
                    leftOffset: crop.left ?? 0,
                    rightOffset: crop.right ?? 0,
                    topOffset: crop.top ?? 0,
                    bottomOffset: crop.bottom ?? 0,
                },
            },
            fields: "cropProperties.leftOffset,cropProperties.rightOffset,cropProperties.topOffset,cropProperties.bottomOffset",
        },
    });
}
export function parseColor(c) {
    let s = c.trim();
    if (s.startsWith("#"))
        s = s.slice(1);
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
        s = s
            .split("")
            .map((ch) => ch + ch)
            .join("");
    }
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
        return {
            red: parseInt(s.slice(0, 2), 16) / 255,
            green: parseInt(s.slice(2, 4), 16) / 255,
            blue: parseInt(s.slice(4, 6), 16) / 255,
        };
    }
    return null;
}
export function deleteAllSlidesRequests(presentation) {
    const slides = presentation.slides ?? [];
    return slides
        .map((s) => s.objectId)
        .filter((id) => typeof id === "string")
        .map((objectId) => ({ deleteObject: { objectId } }));
}
export function presentationPageDims(p) {
    const size = p.pageSize;
    const w = size?.width;
    const h = size?.height;
    if (!w?.magnitude || !h?.magnitude)
        return DEFAULT_PAGE;
    const widthPt = toPt(w.magnitude, w.unit ?? "EMU");
    const heightPt = toPt(h.magnitude, h.unit ?? "EMU");
    return { widthPt, heightPt };
}
function toPt(magnitude, unit) {
    if (unit === "PT")
        return magnitude;
    if (unit === "EMU")
        return magnitude / 12700;
    return magnitude;
}
//# sourceMappingURL=slides_writer.js.map