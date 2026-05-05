import { describe, expect, test } from "bun:test";
import {
  Slide,
  Title,
  Subtitle,
  Bullets,
  Bullet,
  Group,
} from "../src/components.ts";
import { layoutDeck } from "../src/render/layout.ts";
import { renderSlideStill } from "../src/render/screenshot.ts";

describe("renderSlideStill", () => {
  test("at step 0, only step-0 elements appear", () => {
    const deck = [
      Slide({
        children: [
          Title({ children: "Always" }),
          Subtitle({ step: 1, children: "LaterSubtitle" }),
        ],
      }),
    ];
    const html = renderSlideStill(layoutDeck(deck)[0]!, 0);
    expect(html).toContain("Always");
    expect(html).not.toContain("LaterSubtitle");
  });

  test("at step N, all placed with step <= N appear", () => {
    const deck = [
      Slide({
        children: [
          Group({
            children: [
              Title({ children: "FirstReveal" }),
              Subtitle({ children: "SecondReveal" }),
            ],
          }),
        ],
      }),
    ];
    const html1 = renderSlideStill(layoutDeck(deck)[0]!, 1);
    expect(html1).toContain("FirstReveal");
    expect(html1).not.toContain("SecondReveal");

    const html2 = renderSlideStill(layoutDeck(deck)[0]!, 2);
    expect(html2).toContain("FirstReveal");
    expect(html2).toContain("SecondReveal");
  });

  test("bullets with per-item steps: items above current step get hidden class", () => {
    const deck = [
      Slide({
        children: [
          Bullets({
            children: [
              Bullet({ step: 1, children: "VisibleA" }),
              Bullet({ step: 2, children: "HiddenAtOne" }),
            ],
          }),
        ],
      }),
    ];
    const html = renderSlideStill(layoutDeck(deck)[0]!, 1);
    // both bullet texts present (still in DOM, just visibility:hidden)
    expect(html).toContain("VisibleA");
    expect(html).toContain("HiddenAtOne");
    // hidden one is wrapped in li with hidden class
    expect(html).toMatch(/<li class="hidden">HiddenAtOne<\/li>/);
    expect(html).toMatch(/<li class="">VisibleA<\/li>/);
  });

  test("output is self-contained HTML with fixed slide dimensions", () => {
    const deck = [Slide({ children: [Title({ children: "x" })] })];
    const html = renderSlideStill(layoutDeck(deck)[0]!, 0);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("1067px");
    expect(html).toContain("600px");
    // no live-preview JS, no SSE
    expect(html).not.toContain("EventSource");
    expect(html).not.toContain("addEventListener");
  });

  test("escapes special characters in text content", () => {
    const deck = [
      Slide({ children: [Title({ children: "<script>&\"alert\"</script>" })] }),
    ];
    const html = renderSlideStill(layoutDeck(deck)[0]!, 0);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
