import { layoutDeck, SLIDE_H, SLIDE_W } from "./layout.js";
export const DEFAULT_PAGE = { widthPt: SLIDE_W * 72, heightPt: SLIDE_H * 72 };
const ROLE_STYLE = {
    title: { fontSize: 36, bold: true },
    subtitle: { fontSize: 22 },
    heading: { fontSize: 22, bold: true },
    text: { fontSize: 16 },
    quote: { fontSize: 22, italic: true, alignment: "CENTER" },
    attribution: { fontSize: 14, alignment: "CENTER" },
};
const BULLETS_STYLE = { fontSize: 18 };
export function deckToRequests(deck, opts = {}) {
    const page = opts.page ?? DEFAULT_PAGE;
    const sx = page.widthPt / SLIDE_W;
    const sy = page.heightPt / SLIDE_H;
    const placed = layoutDeck(deck);
    const requests = [];
    placed.forEach((slidePlaced, slideIdx) => {
        const slideId = `sk_s_${slideIdx}`;
        requests.push({
            createSlide: {
                objectId: slideId,
                slideLayoutReference: { predefinedLayout: "BLANK" },
            },
        });
        slidePlaced.forEach((p, i) => {
            const elementId = `sk_e_${slideIdx}_${i}`;
            const x = p.x * sx;
            const y = p.y * sy;
            const w = p.w * sx;
            const h = p.h * sy;
            emitElement(requests, slideId, elementId, p, x, y, w, h);
        });
    });
    return requests;
}
function emitElement(out, slideId, elementId, p, x, y, w, h) {
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
        return;
    }
    out.push({
        createShape: { objectId: elementId, shapeType: "TEXT_BOX", elementProperties },
    });
    if (p.kind === "text") {
        if (p.text.length > 0) {
            out.push({ insertText: { objectId: elementId, text: p.text, insertionIndex: 0 } });
            applyStyle(out, elementId, ROLE_STYLE[p.role], p.text.length);
        }
        return;
    }
    // bullets
    const text = p.bullets.map((b) => b.text).join("\n");
    if (text.length === 0)
        return;
    out.push({ insertText: { objectId: elementId, text, insertionIndex: 0 } });
    applyStyle(out, elementId, BULLETS_STYLE, text.length);
    out.push({
        createParagraphBullets: {
            objectId: elementId,
            textRange: { type: "ALL" },
            bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
    });
}
function applyStyle(out, objectId, style, textLength) {
    if (textLength === 0)
        return;
    const fields = ["fontSize"];
    const textStyle = {
        fontSize: { magnitude: style.fontSize, unit: "PT" },
    };
    if (style.bold) {
        textStyle.bold = true;
        fields.push("bold");
    }
    if (style.italic) {
        textStyle.italic = true;
        fields.push("italic");
    }
    out.push({
        updateTextStyle: {
            objectId,
            style: textStyle,
            fields: fields.join(","),
            textRange: { type: "ALL" },
        },
    });
    if (style.alignment) {
        out.push({
            updateParagraphStyle: {
                objectId,
                style: { alignment: style.alignment },
                fields: "alignment",
                textRange: { type: "ALL" },
            },
        });
    }
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