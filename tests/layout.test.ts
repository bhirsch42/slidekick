import { describe, expect, test } from "bun:test";
import { Bullet, Bullets, Slide, Subtitle, Title } from "../src/components.js";
import { layoutDeck, SLIDE_H, SLIDE_W } from "../src/layout.js";

describe("layout", () => {
  test("places title and bullets within slide bounds", () => {
    const deck = [
      Slide({
        children: [
          Title({ children: "Hello" }),
          Bullets({
            children: [Bullet({ children: "one" }), Bullet({ children: "two" })],
          }),
        ],
      }),
    ];
    const slides = layoutDeck(deck);
    expect(slides).toHaveLength(1);
    const items = slides[0]!.placed;
    expect(items).toHaveLength(2);

    const [titleP, bulletsP] = items;
    expect(titleP!.kind).toBe("text");
    if (titleP!.kind === "text") {
      expect(titleP!.runs.map((r) => r.text).join("")).toBe("Hello");
    }

    expect(bulletsP!.kind).toBe("bullets");
    if (bulletsP!.kind === "bullets") {
      expect(bulletsP!.bullets.map((b) => b.runs.map((r) => r.text).join(""))).toEqual([
        "one",
        "two",
      ]);
    }

    for (const p of items) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(SLIDE_W + 0.001);
      expect(p.y + p.h).toBeLessThanOrEqual(SLIDE_H + 0.001);
    }
  });

  test("subtitle gets fixed height; flex content fills the rest", () => {
    const deck = [
      Slide({
        children: [Title({ children: "T" }), Subtitle({ children: "S" })],
      }),
    ];
    const [titleP, subP] = layoutDeck(deck)[0]!.placed;
    expect(titleP!.h).toBeCloseTo(1.0);
    expect(subP!.h).toBeCloseTo(0.7);
  });

  test("background carries through to slide layout", () => {
    const deck = [Slide({ background: "#111", children: [Title({ children: "x" })] })];
    const sl = layoutDeck(deck)[0]!;
    expect(sl.background).toBe("#111");
  });
});
