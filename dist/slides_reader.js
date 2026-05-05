export function presentationToDeck(p) {
    const slides = p.slides ?? [];
    return slides.map(slideToNode);
}
function slideToNode(slide) {
    const elements = (slide.pageElements ?? []).slice().sort((a, b) => yOf(a) - yOf(b));
    const children = [];
    for (const el of elements) {
        const child = elementToChild(el);
        if (child)
            children.push(child);
    }
    return { kind: "slide", children };
}
function yOf(el) {
    return el.transform?.translateY ?? 0;
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
        const bullets = paragraphs.map((p) => ({ kind: "bullet", text: p.text }));
        const node = { kind: "bullets", children: bullets };
        return node;
    }
    const text = paragraphs.map((p) => p.text).join("\n");
    if (!text.trim())
        return null;
    const style = paragraphs[0].style;
    const role = classifyText(style);
    switch (role) {
        case "title":
            return { kind: "title", text };
        case "subtitle":
            return { kind: "subtitle", text };
        case "heading":
            return { kind: "heading", text };
        case "quote":
            return { kind: "quote", text };
        default:
            return { kind: "text", text };
    }
}
function parseParagraphs(text) {
    const elements = text.textElements ?? [];
    const paragraphs = [];
    let current = { text: "", bullet: false, style: {} };
    for (const e of elements) {
        if (e.paragraphMarker) {
            current.bullet = !!e.paragraphMarker.bullet;
        }
        else if (e.textRun) {
            const content = e.textRun.content ?? "";
            const style = e.textRun.style;
            if (style && Object.keys(current.style).length === 0) {
                if (style.fontSize?.magnitude)
                    current.style.fontSize = style.fontSize.magnitude;
                if (style.bold)
                    current.style.bold = true;
                if (style.italic)
                    current.style.italic = true;
            }
            const lines = content.split("\n");
            lines.forEach((line, i) => {
                current.text += line;
                if (i < lines.length - 1) {
                    paragraphs.push(current);
                    current = { text: "", bullet: current.bullet, style: {} };
                }
            });
        }
    }
    if (current.text.length > 0)
        paragraphs.push(current);
    return paragraphs.filter((p) => p.text.length > 0);
}
function classifyText(style) {
    const size = style.fontSize ?? 14;
    if (style.italic && size >= 18)
        return "quote";
    if (style.bold && size >= 30)
        return "title";
    if (style.bold)
        return "heading";
    if (size >= 20)
        return "subtitle";
    return "text";
}
export function deckToTsx(deck) {
    const used = new Set(["Slide"]);
    const slidesSrc = deck.map((s) => renderSlide(s, used)).join(",\n    ");
    const imports = Array.from(used).sort().join(", ");
    return `import { ${imports} } from "slidekick";

export default function deck() {
  return [
    ${slidesSrc},
  ];
}
`;
}
function renderSlide(slide, used) {
    const body = slide.children.map((c) => renderChild(c, used, "      ")).join("\n");
    return `<Slide>\n${body}\n    </Slide>`;
}
function renderChild(node, used, indent) {
    switch (node.kind) {
        case "title":
            used.add("Title");
            return `${indent}<Title>${escapeJsxText(node.text)}</Title>`;
        case "subtitle":
            used.add("Subtitle");
            return `${indent}<Subtitle>${escapeJsxText(node.text)}</Subtitle>`;
        case "heading":
            used.add("Heading");
            return `${indent}<Heading>${escapeJsxText(node.text)}</Heading>`;
        case "text":
            used.add("Text");
            return `${indent}<Text>${escapeJsxText(node.text)}</Text>`;
        case "quote": {
            used.add("Quote");
            const attr = node.attribution ? ` attribution=${JSON.stringify(node.attribution)}` : "";
            return `${indent}<Quote${attr}>${escapeJsxText(node.text)}</Quote>`;
        }
        case "image": {
            used.add("Image");
            const alt = node.alt ? ` alt=${JSON.stringify(node.alt)}` : "";
            return `${indent}<Image src=${JSON.stringify(node.src)}${alt} />`;
        }
        case "bullets": {
            used.add("Bullets");
            used.add("Bullet");
            const items = node.children
                .map((b) => `${indent}  <Bullet>${escapeJsxText(b.text)}</Bullet>`)
                .join("\n");
            return `${indent}<Bullets>\n${items}\n${indent}</Bullets>`;
        }
        case "columns": {
            used.add("Columns");
            used.add("Column");
            const cols = node.children
                .map((c) => {
                const inner = c.children.map((cc) => renderChild(cc, used, `${indent}    `)).join("\n");
                const w = c.weight ? ` weight={${c.weight}}` : "";
                return `${indent}  <Column${w}>\n${inner}\n${indent}  </Column>`;
            })
                .join("\n");
            return `${indent}<Columns>\n${cols}\n${indent}</Columns>`;
        }
        case "group": {
            used.add("Group");
            const inner = node.children.map((c) => renderChild(c, used, `${indent}  `)).join("\n");
            return `${indent}<Group>\n${inner}\n${indent}</Group>`;
        }
    }
}
function escapeJsxText(s) {
    return s.replace(/[{}<>]/g, (c) => `{${JSON.stringify(c)}}`);
}
//# sourceMappingURL=slides_reader.js.map