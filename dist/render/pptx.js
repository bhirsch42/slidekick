import pptxgen from "pptxgenjs";
import { layoutDeck } from "./layout.js";
const PptxCtor = pptxgen;
export async function renderPptx(slides, outPath) {
    const pptx = new PptxCtor();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = "slidekick deck";
    for (const placed of layoutDeck(slides)) {
        const slide = pptx.addSlide();
        for (const p of placed) {
            drawPlaced(slide, p);
        }
    }
    await pptx.writeFile({ fileName: outPath });
}
function drawPlaced(slide, p) {
    if (p.kind === "image") {
        slide.addImage({
            path: p.src,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            sizing: { type: "contain", w: p.w, h: p.h },
        });
        return;
    }
    if (p.kind === "bullets") {
        const items = p.bullets.map((b) => ({ text: b, options: { bullet: true } }));
        slide.addText(items, {
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            fontSize: 18,
            valign: "top",
            color: "222222",
        });
        return;
    }
    slide.addText(p.text, {
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
        ...textStyle(p.role),
    });
}
function textStyle(role) {
    switch (role) {
        case "title":
            return { fontSize: 40, bold: true, valign: "middle", color: "111111" };
        case "subtitle":
            return { fontSize: 22, valign: "middle", color: "555555" };
        case "heading":
            return { fontSize: 24, bold: true, valign: "middle", color: "222222" };
        case "text":
            return { fontSize: 16, valign: "top", color: "222222" };
        case "quote":
            return { fontSize: 24, italic: true, align: "center", valign: "middle", color: "333333" };
        case "attribution":
            return { fontSize: 16, align: "center", valign: "middle", color: "666666" };
    }
}
//# sourceMappingURL=pptx.js.map