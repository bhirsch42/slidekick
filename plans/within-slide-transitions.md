# Within-slide transitions (progressive reveal)

Goal: let deck authors mark elements to appear in sequence on the same slide — bullets one at a time, a chart after the setup text, a punchline after the quote. The classic PowerPoint/Keynote "build" or "animation order" feature, expressed in slidekick's small JSX vocabulary.

## Design principles

- **Authoring stays declarative.** No imperative `slide.addAnimation(...)` calls in deck code. Reveal order is a property of the markup, like layout is.
- **One concept, not ten.** PowerPoint exposes dozens of effects (fly-in, fade, spin). slidekick exposes one: *appear in step N*. The renderer picks a sensible default effect.
- **Same IR, three renderers.** Steps must round-trip through the existing `Placed[]` IR so `html.ts`, `pptx.ts`, and any future renderer all honor them.
- **Static fallback.** Any renderer that can't animate (PDF export, thumbnails, the AI-authoring `agent` view) must show all steps composed — never hide content.

## Markup options

Two surface designs, both viable:

### Option A: `step` prop on any element

```tsx
<Slide>
  <Title>Why slidekick</Title>
  <Bullets>
    <Bullet step={1}>Slides are code</Bullet>
    <Bullet step={2}>AI can author them</Bullet>
    <Bullet step={3}>Output is real .pptx</Bullet>
  </Bullets>
</Slide>
```

Elements without `step` appear at step 0 (always visible). Steps need not be contiguous; the renderer sorts and compacts. Works on any element, not just bullets.

**Pros:** uniform, composable, one prop to learn.
**Cons:** verbose for the common "reveal bullets in order" case; authors have to number by hand.

### Option B: `<Reveal>` wrapper with auto-numbering

```tsx
<Slide>
  <Title>Why slidekick</Title>
  <Reveal>
    <Bullets>
      <Bullet>Slides are code</Bullet>
      <Bullet>AI can author them</Bullet>
      <Bullet>Output is real .pptx</Bullet>
    </Bullets>
  </Reveal>
</Slide>
```

`<Reveal>` assigns step 1, 2, 3… to its direct children in source order. For mixed pacing, allow explicit `step` on children to override.

**Pros:** terse for the 90% case (sequential bullets). Reads like intent ("reveal these").
**Cons:** two ways to express the same thing if combined with Option A; nesting semantics need care (does `<Reveal>` inside `<Columns>` interleave or stay column-local?).

**Recommendation:** ship **both**. `<Reveal>` is sugar over `step`. Internally, the layout pass normalizes `<Reveal>` children into `step={n}` props, then everything downstream sees a single representation.

## IR changes

`Placed` (the inch-bbox node produced by `render/layout.ts`) gains an optional `step?: number` field. Default 0. The layout pass propagates `step` from the source node onto every `Placed` it produces for that subtree.

That's the entire core change. The renderers consume it differently:

## Renderer behavior

### `render/pptx.ts` — pptxgenjs

pptxgenjs supports per-shape animations through the `animation` shape option in recent versions, but coverage is incomplete and the generated XML has historically been finicky. Two sub-options:

1. **Use pptxgenjs's `animation` API** if it covers `appear` with a click trigger and a sequence index. Set every shape with `step > 0` to animate on click in step order.
2. **Post-process the `.pptx`** by editing `ppt/slides/slideN.xml` after pptxgenjs writes — inject a `<p:timing>` block with the click-triggered build sequence. Heavier, but bulletproof and decoupled from pptxgenjs's roadmap.

Start with (1); fall back to (2) if it doesn't produce something Keynote and PowerPoint both honor.

### `render/html.ts` — live preview

Add a step counter to the preview UI: arrow keys advance, current step highlighted, all earlier-step elements visible, later-step elements hidden (or shown ghosted with a toggle). This is the authoring experience — the author needs to *see* the reveal order while iterating, not just trust the build.

### Static / agent view

The `agent` command and any future PDF/thumbnail renderer ignores `step` entirely — all content visible. Document this explicitly so the AI authoring loop sees the full slide, not the step-1 state.

## Edge cases to nail down

- **Bullets that are children of a stepped `<Bullets>`:** does a step on the parent imply each bullet is its own step, or that the whole list appears at once? Proposal: a `step` on `<Bullets>` reveals the whole list at that step. To reveal bullets individually, put `step` on each `<Bullet>` (or wrap the list in `<Reveal>`).
- **Columns:** steps are slide-global, not column-local. Step 2 in column A and step 2 in column B appear together. If authors want column-local sequencing, that's a future feature.
- **Images and quotes:** same as any other element — `step` works.
- **Step ordering vs source order at the same step number:** ties broken by source order.

## Out of scope (explicitly)

- Effect choice (fly-in vs fade vs zoom). One effect, picked by the renderer. Probably "appear" — the most universally supported and least distracting.
- Timed auto-advance. Click-to-advance only. Auto-advance is a separate feature with its own UX questions.
- Exit animations. Things appear; they don't leave.
- Animation between slides (slide transitions). Different feature, different markup.

## Rollout

1. Add `step?: number` to `Placed` and the relevant prop types in `src/types.ts`.
2. Update `render/layout.ts` to propagate `step` through the tree.
3. Add `<Reveal>` component + auto-numbering normalization in the layout pass.
4. Update `render/html.ts` with a step-aware preview (keyboard nav).
5. Wire `render/pptx.ts` to emit click-triggered appear animations (try pptxgenjs API first, post-process XML if needed).
6. Round-trip a test deck through PowerPoint, Keynote, and Google Slides; document any per-target gaps.
