import type { slides_v1 } from "googleapis";
import type {
  BulletNode,
  Deck,
  ImageNode,
  SlideChild,
  SlideNode,
  TextNode,
  TitleNode,
  SubtitleNode,
  HeadingNode,
  BulletsNode,
  QuoteNode,
} from "./types.js";

type Page = slides_v1.Schema$Page;
type PageElement = slides_v1.Schema$PageElement;

export function presentationToDeck(p: slides_v1.Schema$Presentation): Deck {
  const slides = p.slides ?? [];
  return slides.map(slideToNode);
}

function slideToNode(slide: Page): SlideNode {
  const elements = (slide.pageElements ?? []).slice().sort((a, b) => yOf(a) - yOf(b));
  const children: SlideChild[] = [];
  for (const el of elements) {
    const child = elementToChild(el);
    if (child) children.push(child);
  }
  return { kind: "slide", children };
}

function yOf(el: PageElement): number {
  return el.transform?.translateY ?? 0;
}

function elementToChild(el: PageElement): SlideChild | null {
  if (el.image?.contentUrl || el.image?.sourceUrl) {
    const node: ImageNode = {
      kind: "image",
      src: el.image.sourceUrl ?? el.image.contentUrl ?? "",
    };
    return node;
  }
  if (!el.shape?.text) return null;

  const paragraphs = parseParagraphs(el.shape.text);
  if (paragraphs.length === 0) return null;

  const allBullets = paragraphs.every((p) => p.bullet);
  if (allBullets && paragraphs.length > 0) {
    const bullets: BulletNode[] = paragraphs.map((p) => ({ kind: "bullet", text: p.text }));
    const node: BulletsNode = { kind: "bullets", children: bullets };
    return node;
  }

  const text = paragraphs.map((p) => p.text).join("\n");
  if (!text.trim()) return null;
  const style = paragraphs[0]!.style;

  const role = classifyText(style);
  switch (role) {
    case "title":
      return { kind: "title", text } as TitleNode;
    case "subtitle":
      return { kind: "subtitle", text } as SubtitleNode;
    case "heading":
      return { kind: "heading", text } as HeadingNode;
    case "quote":
      return { kind: "quote", text } as QuoteNode;
    default:
      return { kind: "text", text } as TextNode;
  }
}

interface Paragraph {
  text: string;
  bullet: boolean;
  style: { fontSize?: number; bold?: boolean; italic?: boolean };
}

function parseParagraphs(text: slides_v1.Schema$TextContent): Paragraph[] {
  const elements = text.textElements ?? [];
  const paragraphs: Paragraph[] = [];
  let current: Paragraph = { text: "", bullet: false, style: {} };

  for (const e of elements) {
    if (e.paragraphMarker) {
      current.bullet = !!e.paragraphMarker.bullet;
    } else if (e.textRun) {
      const content = e.textRun.content ?? "";
      const style = e.textRun.style;
      if (style && Object.keys(current.style).length === 0) {
        if (style.fontSize?.magnitude) current.style.fontSize = style.fontSize.magnitude;
        if (style.bold) current.style.bold = true;
        if (style.italic) current.style.italic = true;
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
  if (current.text.length > 0) paragraphs.push(current);
  return paragraphs.filter((p) => p.text.length > 0);
}

function classifyText(style: { fontSize?: number; bold?: boolean; italic?: boolean }): string {
  const size = style.fontSize ?? 14;
  if (style.italic && size >= 18) return "quote";
  if (style.bold && size >= 30) return "title";
  if (style.bold) return "heading";
  if (size >= 20) return "subtitle";
  return "text";
}

export function deckToTsx(deck: Deck): string {
  const used = new Set<string>(["Slide"]);
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

function renderSlide(slide: SlideNode, used: Set<string>): string {
  const body = slide.children.map((c) => renderChild(c, used, "      ")).join("\n");
  return `<Slide>\n${body}\n    </Slide>`;
}

function renderChild(node: SlideChild, used: Set<string>, indent: string): string {
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

function escapeJsxText(s: string): string {
  return s.replace(/[{}<>]/g, (c) => `{${JSON.stringify(c)}}`);
}
