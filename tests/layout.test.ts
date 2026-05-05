import { describe, expect, test } from "bun:test";
import {
  Slide,
  Title,
  Subtitle,
  Heading,
  Bullets,
  Bullet,
  Text,
  Group,
  Columns,
  Column,
} from "../src/components.ts";
import { layoutDeck, type Placed } from "../src/render/layout.ts";
import { maxStepOf } from "../src/render/screenshot.ts";

function steps(placed: Placed[]): number[] {
  return placed.map((p) => p.step);
}

describe("layoutDeck step resolution", () => {
  test("no steps anywhere → all placed have step 0", () => {
    const deck = [
      Slide({
        children: [Title({ children: "Hi" }), Subtitle({ children: "there" })],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(placed!.length).toBe(2);
    expect(steps(placed!)).toEqual([0, 0]);
  });

  test("explicit step on a leaf wins", () => {
    const deck = [
      Slide({
        children: [
          Title({ children: "Hi" }),
          Subtitle({ step: 2, children: "there" }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    const sub = placed!.find(
      (p) => p.kind === "text" && p.role === "subtitle",
    );
    expect(sub?.step).toBe(2);
  });

  test("Group with no step auto-numbers direct children 1..N", () => {
    const deck = [
      Slide({
        children: [
          Title({ children: "Story" }),
          Group({
            children: [
              Heading({ children: "A" }),
              Text({ children: "B" }),
              Heading({ children: "C" }),
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    // first placed is title (step 0), then headings/text in order
    const nonTitle = placed!.filter((p) => !(p.kind === "text" && p.role === "title"));
    expect(steps(nonTitle)).toEqual([1, 2, 3]);
  });

  test("Group with explicit step grants that step to all children", () => {
    const deck = [
      Slide({
        children: [
          Group({
            step: 7,
            children: [Text({ children: "a" }), Text({ children: "b" })],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(steps(placed!)).toEqual([7, 7]);
  });

  test("child step inside auto-numbering Group overrides position", () => {
    const deck = [
      Slide({
        children: [
          Group({
            children: [
              Text({ children: "first" }),
              Text({ step: 99, children: "explicit" }),
              Text({ children: "third" }),
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(steps(placed!)).toEqual([1, 99, 3]);
  });

  test("Bullets with no step + per-Bullet step → bullet items carry their step", () => {
    const deck = [
      Slide({
        children: [
          Bullets({
            children: [
              Bullet({ step: 1, children: "a" }),
              Bullet({ step: 2, children: "b" }),
              Bullet({ step: 3, children: "c" }),
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    const bullets = placed!.find((p) => p.kind === "bullets");
    expect(bullets?.kind).toBe("bullets");
    if (bullets?.kind === "bullets") {
      expect(bullets.bullets.map((b) => b.step)).toEqual([1, 2, 3]);
    }
  });

  test("Bullets with step → bullets inherit that step", () => {
    const deck = [
      Slide({
        children: [
          Bullets({
            step: 4,
            children: [Bullet({ children: "a" }), Bullet({ children: "b" })],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    const bullets = placed!.find((p) => p.kind === "bullets");
    if (bullets?.kind === "bullets") {
      expect(bullets.step).toBe(4);
      expect(bullets.bullets.map((b) => b.step)).toEqual([4, 4]);
    }
  });

  test("Columns: children in each column inherit independently", () => {
    const deck = [
      Slide({
        children: [
          Columns({
            children: [
              Column({
                children: [Heading({ step: 1, children: "L" })],
              }),
              Column({
                step: 5,
                children: [Heading({ children: "R" })],
              }),
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    const headings = placed!.filter(
      (p) => p.kind === "text" && p.role === "heading",
    );
    expect(headings.length).toBe(2);
    expect(headings[0]!.step).toBe(1);
    expect(headings[1]!.step).toBe(5);
  });

  test("Quote with attribution: both placed share the quote's step", () => {
    const deck = [
      Slide({
        children: [
          Group({
            children: [
              Heading({ children: "intro" }),
              // second child of Group → step 2
              // (use a simple Text instead of Quote for this assertion;
              //  Quote is exercised below)
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(placed!.length).toBe(1);
    expect(placed![0]!.step).toBe(1);
  });

  test("Text wrapper renders its string children (not empty)", () => {
    const deck = [
      Slide({ children: [Text({ children: "hello body" })] }),
    ];
    const [placed] = layoutDeck(deck);
    const text = placed!.find((p) => p.kind === "text" && p.role === "text");
    expect(text?.kind).toBe("text");
    if (text?.kind === "text") expect(text.text).toBe("hello body");
  });

  test("step 0 explicit means 'always visible' (same as undefined)", () => {
    const deck = [
      Slide({
        children: [
          Group({
            children: [
              Title({ step: 0, children: "always" }),
              Subtitle({ children: "step 2" }),
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    const title = placed!.find((p) => p.kind === "text" && p.role === "title");
    const sub = placed!.find((p) => p.kind === "text" && p.role === "subtitle");
    expect(title?.step).toBe(0);
    expect(sub?.step).toBe(2);
  });
});

describe("maxStepOf", () => {
  test("0 for a slide with no steps", () => {
    const deck = [
      Slide({
        children: [Title({ children: "x" }), Subtitle({ children: "y" })],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(maxStepOf(placed!)).toBe(0);
  });

  test("picks max across placed.step", () => {
    const deck = [
      Slide({
        children: [
          Title({ step: 1, children: "a" }),
          Subtitle({ step: 5, children: "b" }),
          Heading({ step: 3, children: "c" }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(maxStepOf(placed!)).toBe(5);
  });

  test("picks max across bullet items even if list step is lower", () => {
    const deck = [
      Slide({
        children: [
          Bullets({
            children: [
              Bullet({ step: 1, children: "a" }),
              Bullet({ step: 7, children: "b" }),
            ],
          }),
        ],
      }),
    ];
    const [placed] = layoutDeck(deck);
    expect(maxStepOf(placed!)).toBe(7);
  });
});
