import { describe, expect, test } from "bun:test";
import {
  Slide,
  Title,
  Subtitle,
  Bullets,
  Bullet,
  Group,
  Text,
} from "../src/components.ts";
import { layoutDeck } from "../src/render/layout.ts";
import { expandFrames } from "../src/render/image-pptx.ts";

describe("expandFrames", () => {
  test("slide with no steps → 1 frame at step 0", () => {
    const deck = [Slide({ children: [Title({ children: "x" })] })];
    const frames = expandFrames(layoutDeck(deck));
    expect(frames).toEqual([{ slideIndex: 0, step: 0 }]);
  });

  test("slide with maxStep N → N+1 frames (0..N)", () => {
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
    const frames = expandFrames(layoutDeck(deck));
    expect(frames).toEqual([
      { slideIndex: 0, step: 0 },
      { slideIndex: 0, step: 1 },
      { slideIndex: 0, step: 2 },
      { slideIndex: 0, step: 3 },
    ]);
  });

  test("multiple slides expand independently and in source order", () => {
    const deck = [
      Slide({ children: [Title({ children: "intro" })] }),
      Slide({
        children: [
          Group({
            children: [Text({ children: "a" }), Text({ children: "b" })],
          }),
        ],
      }),
      Slide({ children: [Subtitle({ children: "outro" })] }),
    ];
    const frames = expandFrames(layoutDeck(deck));
    expect(frames).toEqual([
      { slideIndex: 0, step: 0 },
      { slideIndex: 1, step: 0 },
      { slideIndex: 1, step: 1 },
      { slideIndex: 1, step: 2 },
      { slideIndex: 2, step: 0 },
    ]);
  });

  test("empty deck → no frames", () => {
    expect(expandFrames(layoutDeck([]))).toEqual([]);
  });

  test("Group on a single slide produces frames 0..N for N children", () => {
    const deck = [
      Slide({
        children: [
          Group({
            children: [
              Text({ children: "a" }),
              Text({ children: "b" }),
              Text({ children: "c" }),
              Text({ children: "d" }),
            ],
          }),
        ],
      }),
    ];
    const frames = expandFrames(layoutDeck(deck));
    expect(frames.length).toBe(5);
    expect(frames.map((f) => f.step)).toEqual([0, 1, 2, 3, 4]);
  });
});
