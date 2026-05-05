import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { loadTokens } from "../src/auth.js";
import { Bullet, Bullets, Slide, Subtitle, Title } from "../src/components.js";
import {
  getClients,
  parsePresentationId,
  presentationUrl,
} from "../src/slides_client.js";
import { presentationToDeck } from "../src/slides_reader.js";
import {
  deckToRequests,
  deleteAllSlidesRequests,
  presentationPageDims,
} from "../src/slides_writer.js";
import type { Deck } from "../src/types.js";

const hasEnv = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasToken = await loadTokens().then((t) => t !== null).catch(() => false);
const RUN_LIVE = hasEnv && hasToken;

if (!RUN_LIVE) {
  console.warn(
    `[roundtrip] skipping live tests: ${
      !hasEnv ? "no .env" : "no token (run `slidekick auth login`)"
    }`,
  );
}

describe.skipIf(!RUN_LIVE)("live round-trip against Google Slides", () => {
  let presentationId = "";

  const deck: Deck = [
    Slide({
      children: [
        Title({ children: "Round-trip test" }),
        Subtitle({ children: "slidekick → Slides → slidekick" }),
      ],
    }),
    Slide({
      children: [
        Title({ children: "Why this matters" }),
        Bullets({
          children: [
            Bullet({ children: "Catch API drift early" }),
            Bullet({ children: "Verify reader/writer symmetry" }),
            Bullet({ children: "Real round-trip, not a mock" }),
          ],
        }),
      ],
    }),
  ];

  beforeAll(async () => {
    const { slides } = await getClients();
    const created = await slides.presentations.create({
      requestBody: {
        title: `slidekick roundtrip ${new Date().toISOString()}`,
        pageSize: {
          width: { magnitude: 12192000, unit: "EMU" },
          height: { magnitude: 6858000, unit: "EMU" },
        },
      },
    });
    const id = created.data.presentationId;
    if (!id) throw new Error("no presentationId from create");
    presentationId = id;

    const deletes = deleteAllSlidesRequests(created.data);
    const writes = deckToRequests(deck, { page: presentationPageDims(created.data) });
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: [...deletes, ...writes] },
    });
    console.log(`  created: ${presentationUrl(presentationId)}`);
  });

  afterAll(async () => {
    if (!presentationId) return;
    try {
      const { drive } = await getClients();
      await drive.files.delete({ fileId: presentationId });
      console.log(`  deleted: ${presentationId}`);
    } catch (e) {
      console.warn(`  cleanup failed (delete manually): ${(e as Error).message}`);
    }
  });

  test("pulled deck has the same number of slides", async () => {
    const { slides } = await getClients();
    const got = await slides.presentations.get({ presentationId });
    const pulled = presentationToDeck(got.data);
    expect(pulled.slides).toHaveLength(deck.length);
  });

  test("pulled slide 0 has a Title and a Subtitle", async () => {
    const { slides } = await getClients();
    const got = await slides.presentations.get({ presentationId });
    const pulled = presentationToDeck(got.data);
    const kinds = pulled.slides[0]!.children.map((c) => c.kind);
    expect(kinds).toContain("title");
    expect(kinds).toContain("subtitle");

    const titleNode = pulled.slides[0]!.children.find((c) => c.kind === "title");
    const text = titleNode && "runs" in titleNode
      ? titleNode.runs.map((r) => r.text).join("")
      : "";
    expect(text).toBe("Round-trip test");
  });

  test("pulled slide 1 has a Bullets node with 3 bullets", async () => {
    const { slides } = await getClients();
    const got = await slides.presentations.get({ presentationId });
    const pulled = presentationToDeck(got.data);
    const bulletsNode = pulled.slides[1]!.children.find((c) => c.kind === "bullets");
    expect(bulletsNode).toBeTruthy();
    if (bulletsNode && bulletsNode.kind === "bullets") {
      expect(bulletsNode.children).toHaveLength(3);
      expect(
        bulletsNode.children.map((b) => b.runs.map((r) => r.text).join("")),
      ).toEqual([
        "Catch API drift early",
        "Verify reader/writer symmetry",
        "Real round-trip, not a mock",
      ]);
    }
  });
});

// Suppress unused-import warning when only re-exporting.
export { parsePresentationId };
