import { describe, expect, test } from "bun:test";
import {
  Bullet,
  Bullets,
  Cite,
  Em,
  Slide,
  Span,
  Subtitle,
  Title,
} from "../src/components.js";
import { layoutDeck } from "../src/layout.js";
import { deckToRequests } from "../src/slides_writer.js";
import type { DeckModule, Theme } from "../src/types.js";

describe("theme defaults", () => {
  test("themeless: existing decks render unchanged (no pageBackgroundFill)", () => {
    const reqs = deckToRequests([
      Slide({ children: [Title({ children: "Hi" })] }),
    ]);
    expect(reqs.some((r) => r.updatePageProperties)).toBe(false);
  });

  test("theme.background applies to every slide via updatePageProperties", () => {
    const theme: Theme = {
      background: "#111111",
      text: "#ffffff",
      fonts: { body: "Times New Roman" },
    };
    const deck: DeckModule = {
      theme,
      slides: [
        Slide({ children: [Title({ children: "A" })] }),
        Slide({ children: [Title({ children: "B" })] }),
      ],
    };
    const reqs = deckToRequests(deck);
    const bgUpdates = reqs.filter((r) => r.updatePageProperties);
    expect(bgUpdates).toHaveLength(2);
    const fill =
      bgUpdates[0]!.updatePageProperties!.pageProperties!.pageBackgroundFill;
    expect(fill?.solidFill?.color?.rgbColor).toBeTruthy();
  });

  test("theme.text and theme.fonts.body show up in updateTextStyle", () => {
    const theme: Theme = {
      text: "#ffffff",
      fonts: { body: "Times New Roman" },
    };
    const deck: DeckModule = {
      theme,
      slides: [Slide({ children: [Title({ children: "A" })] })],
    };
    const reqs = deckToRequests(deck);
    const styled = reqs.find((r) => r.updateTextStyle);
    expect(styled?.updateTextStyle?.style?.fontFamily).toBe("Times New Roman");
    expect(styled?.updateTextStyle?.style?.foregroundColor).toBeTruthy();
  });
});

describe("slide background", () => {
  test("solid background string emits solidFill", () => {
    const reqs = deckToRequests([
      Slide({ background: "#000", children: [Title({ children: "x" })] }),
    ]);
    const upd = reqs.find((r) => r.updatePageProperties)!;
    expect(
      upd.updatePageProperties!.pageProperties!.pageBackgroundFill!.solidFill,
    ).toBeTruthy();
  });

  test("image background emits stretchedPictureFill", () => {
    const reqs = deckToRequests([
      Slide({
        background: { image: "https://example.com/a.jpg" },
        children: [],
      }),
    ]);
    const upd = reqs.find((r) => r.updatePageProperties)!;
    expect(
      upd.updatePageProperties!.pageProperties!.pageBackgroundFill!
        .stretchedPictureFill?.contentUrl,
    ).toBe("https://example.com/a.jpg");
  });

  test("Slide with no children and a background creates no shapes", () => {
    const reqs = deckToRequests([Slide({ background: "#111", children: [] })]);
    expect(reqs.some((r) => r.createShape)).toBe(false);
  });

  test("<Slide><Image/></Slide> places the image as a content child, not a background", () => {
    const { Image } = require("../src/components.js");
    const reqs = deckToRequests([
      Slide({ children: [Image({ src: "https://x/y.jpg" })] }),
    ]);
    expect(reqs.some((r) => r.createImage)).toBe(true);
    expect(reqs.some((r) => r.updatePageProperties)).toBe(false);
  });
});

describe("inline rich text", () => {
  test("mixed-run subtitle with Cite produces multiple runs", () => {
    const node = Subtitle({
      children: [
        "Christopher Hitchens",
        "\n",
        Cite({
          children: [
            "British American Journalist",
            "\n",
            "Born April 13th, 1949",
          ],
        }),
      ],
    });
    expect(node.runs.length).toBeGreaterThan(1);
    const cited = node.runs.find((r) => r.style?.cite);
    expect(cited).toBeTruthy();
    const all = node.runs.map((r) => r.text).join("");
    expect(all).toContain("Christopher Hitchens");
    expect(all).toContain("British American Journalist");
    expect(all).toContain("Born April 13th, 1949");
  });

  test("Cite gets accent color and ~75% size in writer", () => {
    const theme: Theme = { accent: "#888888" };
    const deck: DeckModule = {
      theme,
      slides: [
        Slide({
          children: [
            Subtitle({
              children: ["Name", "\n", Cite({ children: "credit" })],
            }),
          ],
        }),
      ],
    };
    const reqs = deckToRequests(deck);
    const inserts = reqs.filter((r) => r.insertText);
    expect(inserts[0]!.insertText!.text).toBe("Name\ncredit");
    const styled = reqs.filter((r) => r.updateTextStyle);
    const fixedRange = styled.filter(
      (r) => r.updateTextStyle?.textRange?.type === "FIXED_RANGE",
    );
    expect(fixedRange.length).toBeGreaterThanOrEqual(2);
    const citeRange = fixedRange.find((r) => {
      const tr = r.updateTextStyle!.textRange!;
      return tr.startIndex === 5 && tr.endIndex === 11;
    });
    expect(citeRange).toBeTruthy();
    const baseSubtitle = 22;
    const expectedCite = baseSubtitle * 0.75;
    expect(citeRange!.updateTextStyle!.style!.fontSize!.magnitude).toBeCloseTo(
      expectedCite,
    );
    expect(citeRange!.updateTextStyle!.style!.foregroundColor).toBeTruthy();
  });

  test("themed Bullet with inline Em produces italic run", () => {
    const node = Bullet({
      children: ["plain ", Em({ children: "italic" }), " end"],
    });
    expect(node.runs).toHaveLength(3);
    expect(node.runs[1]!.style?.italic).toBe(true);
    expect(node.runs.map((r) => r.text).join("")).toBe("plain italic end");
  });

  test("Bullets emit per-run updateTextStyle inside the joined text", () => {
    const deck = [
      Slide({
        children: [
          Bullets({
            children: [Bullet({ children: ["a ", Em({ children: "b" })] })],
          }),
        ],
      }),
    ];
    const reqs = deckToRequests(deck);
    const insert = reqs.find((r) => r.insertText);
    expect(insert?.insertText?.text).toBe("a b");
    const fixedRanges = reqs.filter(
      (r) => r.updateTextStyle?.textRange?.type === "FIXED_RANGE",
    );
    const italicRange = fixedRanges.find(
      (r) => r.updateTextStyle?.style?.italic === true,
    );
    expect(italicRange).toBeTruthy();
  });
});

describe("Span with explicit overrides", () => {
  test("Span color/size flow into the writer style", () => {
    const deck: DeckModule = {
      slides: [
        Slide({
          children: [
            Title({
              children: ["A ", Span({ children: "red", color: "#ff0000" })],
            }),
          ],
        }),
      ],
    };
    const reqs = deckToRequests(deck);
    const fixedRanges = reqs.filter(
      (r) => r.updateTextStyle?.textRange?.type === "FIXED_RANGE",
    );
    const colored = fixedRanges.find(
      (r) => r.updateTextStyle?.style?.foregroundColor !== undefined,
    );
    expect(colored).toBeTruthy();
  });
});

describe("slide align", () => {
  test("center alignment shifts content y when natural < area", () => {
    const deck = [
      Slide({
        align: "center",
        background: "#000",
        children: [Title({ children: "centered" })],
      }),
    ];
    const sl = layoutDeck(deck)[0]!;
    expect(sl.placed[0]!.y).toBeGreaterThan(0.5);
  });

  test("end alignment pushes content to the bottom", () => {
    const deck = [
      Slide({
        align: "end",
        background: "#000",
        children: [Title({ children: "bottom" })],
      }),
    ];
    const sl = layoutDeck(deck)[0]!;
    const titleP = sl.placed[0]!;
    expect(titleP.y + titleP.h).toBeLessThanOrEqual(7.5 + 0.001);
    expect(titleP.y).toBeGreaterThan(5);
  });
});

describe("scrim", () => {
  test("image background with numeric scrim emits a full-page rectangle", () => {
    const reqs = deckToRequests([
      Slide({
        background: { image: "https://x/y.jpg", scrim: 0.4 },
        children: [Title({ children: "T" })],
      }),
    ]);
    const rect = reqs.find((r) => r.createShape?.shapeType === "RECTANGLE");
    expect(rect).toBeTruthy();
    const fill = reqs.find(
      (r) =>
        r.updateShapeProperties?.shapeProperties?.shapeBackgroundFill
          ?.solidFill !== undefined,
    );
    const sf =
      fill!.updateShapeProperties!.shapeProperties!.shapeBackgroundFill!
        .solidFill!;
    expect(sf.alpha).toBeCloseTo(0.4);
    expect(sf.color?.rgbColor).toEqual({ red: 0, green: 0, blue: 0 });
  });

  test("solid color background does not emit a scrim rect", () => {
    const reqs = deckToRequests([
      Slide({ background: "#111", children: [Title({ children: "T" })] }),
    ]);
    expect(reqs.some((r) => r.createShape?.shapeType === "RECTANGLE")).toBe(
      false,
    );
  });

  test("scrim shape is created before the content text shape", () => {
    const reqs = deckToRequests([
      Slide({
        background: { image: "https://x/y.jpg", scrim: 0.5 },
        children: [Title({ children: "T" })],
      }),
    ]);
    const rectIdx = reqs.findIndex(
      (r) => r.createShape?.shapeType === "RECTANGLE",
    );
    const textIdx = reqs.findIndex(
      (r) => r.createShape?.shapeType === "TEXT_BOX",
    );
    expect(rectIdx).toBeGreaterThan(-1);
    expect(textIdx).toBeGreaterThan(rectIdx);
  });
});

describe("paragraph alignment", () => {
  test("Subtitle align=center emits updateParagraphStyle CENTER", () => {
    const reqs = deckToRequests([
      Slide({ children: [Subtitle({ align: "center", children: "hi" })] }),
    ]);
    const para = reqs.find(
      (r) => r.updateParagraphStyle?.style?.alignment === "CENTER",
    );
    expect(para).toBeTruthy();
  });
});

describe("user-defined components and fragments", () => {
  test("a function returning multiple slides flattens into the deck", () => {
    function Section(props: {
      title: string;
    }): import("../src/types.js").SlideNode[] {
      return [
        Slide({ children: [Title({ children: props.title })] }),
        Slide({ children: [Subtitle({ children: "follow-up" })] }),
      ];
    }
    const reqs = deckToRequests([
      ...Section({ title: "A" }),
      Slide({ children: [Title({ children: "B" })] }),
    ]);
    const slideCreates = reqs.filter((r) => r.createSlide);
    expect(slideCreates).toHaveLength(3);
  });

  test("nested arrays of slide children get flattened", () => {
    const slide = Slide({
      children: [
        [Title({ children: "T" }), Subtitle({ children: "S" })],
        [[Subtitle({ children: "S2" })]],
      ],
    });
    expect(slide.children).toHaveLength(3);
    expect(slide.children.map((c) => c.kind)).toEqual([
      "title",
      "subtitle",
      "subtitle",
    ]);
  });

  test("falsy children (null, undefined, false) are dropped", () => {
    const slide = Slide({
      children: [
        Title({ children: "T" }),
        false as unknown as never,
        null as unknown as never,
        undefined as unknown as never,
        Subtitle({ children: "S" }),
      ],
    });
    expect(slide.children.map((c) => c.kind)).toEqual(["title", "subtitle"]);
  });
});

describe("image fit and crop", () => {
  test("default fit is contain", () => {
    const { Image } = require("../src/components.js");
    const deck = [Slide({ children: [Image({ src: "https://x/a.jpg" })] })];
    const sl = layoutDeck(deck)[0]!;
    const img = sl.placed[0]!;
    expect(img.kind).toBe("image");
    if (img.kind === "image") expect(img.fit).toBe("contain");
  });

  test("crop emits updateImageProperties", () => {
    const { Image } = require("../src/components.js");
    const reqs = deckToRequests([
      Slide({
        children: [
          Image({
            src: "https://x/a.jpg",
            crop: { left: 0.1, right: 0.1, top: 0, bottom: 0 },
          }),
        ],
      }),
    ]);
    const upd = reqs.find((r) => r.updateImageProperties);
    expect(upd).toBeTruthy();
    expect(
      upd!.updateImageProperties!.imageProperties!.cropProperties!.leftOffset,
    ).toBeCloseTo(0.1);
  });
});
