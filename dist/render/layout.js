export const SLIDE_W = 13.333;
export const SLIDE_H = 7.5;
const PAD = 0.5;
const GAP = 0.2;
const TITLE_H = 1.0;
const SUBTITLE_H = 0.7;
const HEADING_H = 0.5;
export function layoutDeck(slides) {
    return slides.map(layoutSlide);
}
function layoutSlide(slide) {
    const out = [];
    const area = { x: PAD, y: PAD, w: SLIDE_W - 2 * PAD, h: SLIDE_H - 2 * PAD };
    layoutVertical(slide.children, area, out);
    return out;
}
function fixedHeight(type) {
    if (type === "title")
        return TITLE_H;
    if (type === "subtitle")
        return SUBTITLE_H;
    if (type === "heading")
        return HEADING_H;
    return null;
}
function layoutVertical(children, area, out) {
    if (children.length === 0)
        return;
    const fixedTotal = children.reduce((s, c) => s + (fixedHeight(c.type) ?? 0), 0);
    const flexCount = children.filter((c) => fixedHeight(c.type) === null).length;
    const totalGaps = Math.max(0, children.length - 1) * GAP;
    const flexAvailable = Math.max(0, area.h - fixedTotal - totalGaps);
    const flexEach = flexCount > 0 ? flexAvailable / flexCount : 0;
    let y = area.y;
    for (const child of children) {
        const h = fixedHeight(child.type) ?? flexEach;
        layoutNode(child, { x: area.x, y, w: area.w, h }, out);
        y += h + GAP;
    }
}
function layoutNode(node, area, out) {
    switch (node.type) {
        case "title":
            out.push({ kind: "text", role: "title", text: extractText(node), ...area });
            return;
        case "subtitle":
            out.push({ kind: "text", role: "subtitle", text: extractText(node), ...area });
            return;
        case "heading":
            out.push({ kind: "text", role: "heading", text: extractText(node), ...area });
            return;
        case "text":
            out.push({ kind: "text", role: "text", text: extractText(node), ...area });
            return;
        case "bullets": {
            const bullets = node.children
                .filter((c) => c.type === "bullet")
                .map(extractText);
            out.push({ kind: "bullets", bullets, ...area });
            return;
        }
        case "bullet":
            out.push({ kind: "bullets", bullets: [extractText(node)], ...area });
            return;
        case "image":
            out.push({
                kind: "image",
                src: String(node.props.src ?? ""),
                alt: node.props.alt,
                ...area,
            });
            return;
        case "quote": {
            const attribution = node.props.attribution;
            const attrH = attribution ? 0.5 : 0;
            out.push({
                kind: "text",
                role: "quote",
                text: extractText(node),
                x: area.x,
                y: area.y,
                w: area.w,
                h: area.h - attrH,
            });
            if (attribution) {
                out.push({
                    kind: "text",
                    role: "attribution",
                    text: `— ${attribution}`,
                    x: area.x,
                    y: area.y + area.h - attrH,
                    w: area.w,
                    h: attrH,
                });
            }
            return;
        }
        case "columns": {
            const cols = node.children.filter((c) => c.type === "column");
            if (cols.length === 0)
                return;
            const totalWeight = cols.reduce((s, c) => s + (c.props.weight ?? 1), 0);
            const gap = node.props.gap ?? 0.3;
            const totalGap = (cols.length - 1) * gap;
            const usableW = Math.max(0, area.w - totalGap);
            let x = area.x;
            for (const col of cols) {
                const w = ((col.props.weight ?? 1) / totalWeight) * usableW;
                layoutVertical(col.children, { x, y: area.y, w, h: area.h }, out);
                x += w + gap;
            }
            return;
        }
        case "column":
            layoutVertical(node.children, area, out);
            return;
        case "fragment":
            layoutVertical(node.children, area, out);
            return;
        default:
            return;
    }
}
function extractText(node) {
    if (node.type === "text")
        return String(node.props.value ?? "");
    return node.children.map(extractText).join("");
}
//# sourceMappingURL=layout.js.map