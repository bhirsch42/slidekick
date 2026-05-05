import { describe, expect, test } from "bun:test";
import { Bullet, Bullets, Slide, Title } from "../src/components.js";
import { deckToRequests } from "../src/slides_writer.js";

describe("slides_writer", () => {
  test("emits createSlide + createShape + insertText for a title", () => {
    const deck = [Slide({ children: [Title({ children: "Hi" })] })];
    const reqs = deckToRequests(deck);

    const kinds = reqs.map((r) => Object.keys(r)[0]);
    expect(kinds[0]).toBe("createSlide");
    expect(kinds).toContain("createShape");
    expect(kinds).toContain("insertText");
    expect(kinds).toContain("updateTextStyle");

    const insert = reqs.find((r) => r.insertText);
    expect(insert?.insertText?.text).toBe("Hi");
  });

  test("emits createParagraphBullets for a Bullets node", () => {
    const deck = [
      Slide({
        children: [
          Bullets({
            children: [Bullet({ children: "a" }), Bullet({ children: "b" })],
          }),
        ],
      }),
    ];
    const reqs = deckToRequests(deck);
    const insert = reqs.find((r) => r.insertText);
    expect(insert?.insertText?.text).toBe("a\nb");
    expect(reqs.some((r) => r.createParagraphBullets)).toBe(true);
  });

  test("creates a slide per Slide node", () => {
    const deck = [
      Slide({ children: [Title({ children: "1" })] }),
      Slide({ children: [Title({ children: "2" })] }),
    ];
    const reqs = deckToRequests(deck);
    const slideCount = reqs.filter((r) => r.createSlide).length;
    expect(slideCount).toBe(2);
  });
});
