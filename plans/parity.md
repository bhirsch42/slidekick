# Parity plan: image-led decks

Goal: re-author the IJF deck (dark theme, image-led, mixed typography) without
leaving the column layout model. No tables, no tabs, no absolute coordinates.

Reference deck: `1tHQsm5Hy4JEtzD6dVq9h_z1aAgDsklcIjLZHBS5HSPM` (read-only).
Raw JSON snapshot: `/tmp/deck.json`. Pulled TSX: `/tmp/deck-pulled.tsx`.

## PR 1 — theme, slide background, inline runs

These three co-depend: a black-background slide with white Times text needs all
of them to render correctly. Land together.

### Theme

A deck can return either `Slide[]` (today) or `{ theme?, slides }`.
Themeless by default — existing decks render unchanged.

```ts
export interface Theme {
  background?: Color;          // slide bg
  text?: Color;                // default text color
  accent?: Color;              // <Cite>, attribution, dim text
  fonts?: {
    body?: string;
    display?: string;          // <Title>/<Heading>; falls back to body
    mono?: string;
  };
  sizes?: Partial<Record<TextRole, number>>;  // pt overrides
}
```

Resolves to: master `pageBackgroundFill` + per-`textRun` `foregroundColor` /
`fontFamily` / `fontSize` defaults.

### Slide background

```ts
<Slide background="#111" />                              // solid color
<Slide background={{ image: "https://…" }} />            // full-bleed photo
```

- Background renders behind everything; always `cover`. No `fit` prop.
- When `background` is set and there are no children, padding drops to zero
  automatically. With children, normal safe-area padding applies.
- `<Slide><Image/></Slide>` is *not* a background — it places the image as a
  content child laid out in the padded area like any other element.

### Inline rich text

`TextChildren` widens to allow inline span elements inside `<Title>`,
`<Subtitle>`, `<Heading>`, `<Text>`, `<Bullet>`, `<Quote>`:

```ts
<Span size?: number | "sm"|"md"|"lg"
      weight?: 400|700
      italic?: boolean
      font?: string
      color?: Color>

<Em>      // italic
<Strong>  // bold
<Cite>    // italic + ~75% size + theme.accent (theme-driven)
```

Use:

```tsx
<Subtitle>
  Christopher Hitchens{"\n"}
  <Cite>British American Journalist{"\n"}Born April 13th, 1949</Cite>
</Subtitle>
```

Newlines stay as `{"\n"}` — no `<Br/>`.

Implementation: `joinText` becomes `flattenInline` and emits `Run[]` (text +
style overrides). Text-bearing `Placed` variants carry `runs: Run[]` instead
of `text: string`. Big-bang migration — repo is early, no external decks.

### Surface changes (PR 1)

| File | Change |
|---|---|
| `types.ts` | `SlideNode` gets `background`. Add `Theme`, `Run`, `SpanNode`. Replace `text: string` with `runs: Run[]` on text-bearing nodes. |
| `components.ts` | New: `Span`, `Em`, `Strong`, `Cite`. Updated `Slide`. Default-export wrapper accepts `{ theme, slides }` or `Slide[]`. |
| `layout.ts` | Per-slide `background` field on output (not in `Placed[]`). Drop padding when background is set and children are empty. Carry runs through. |
| `slides_writer.ts` | Emit `pageBackgroundFill` per slide. Emit per-run `updateTextStyle`. Resolve theme defaults. |
| `html.ts` | Mirror everything for local preview. |
| `tests/` | Round-trip: theme defaults, solid background, image background, mixed-run subtitle, `<Cite>`. |

## PR 2 — image controls + slide alignment

Smaller, depends on PR 1.

### Image

```ts
<Image src
       fit?: "contain" | "cover" | "fill"   // default "contain"
       crop?: { top?: number; right?: number; bottom?: number; left?: number } />
```

`contain` is the new default — preserves original aspect ratio inside the
column box. `fill` stretches (today's behavior). `cover` crops to fill.

### Slide alignment (overlay cases only)

```ts
<Slide align="start" | "center" | "end">
```

Aligns the whole content stack on the block axis when natural height < area
height. Used for the "LAB TESS" floater and the bottom-right Instagram CTA —
text centered/anchored on a backgrounded slide. `<Column align/justify>` is
*not* added; no slide in the reference deck needs it.

## PR 3 — reader updates

Make `slidekick pull` round-trip the new vocab.

- **Theme inference.** Master `pageBackgroundFill` → `theme.background`. Mode
  of `textRun.foregroundColor` → `theme.text`. Mode of `fontFamily` →
  `theme.fonts.body`.
- **Slide background detection.** Image bbox ≈ full page (within ~1%) →
  `<Slide background={{ image }}>`, regardless of whether overlays exist. No
  ambiguity with content images.
- **Inline run detection.** Any deviation from the slide's dominant text style
  (size, family, italic, weight, color) emits a `<Span>` wrapper. The
  writer/reader pair should be lossless on text styling.
- **Unsupported shapes** (lines, charts, groups, word art, tables): emit a
  `// TODO: unsupported <kind>` comment in the TSX and skip.

## Future work

- **`background.scrim`** — opacity overlay on `<Slide background={{image}}>`
  for legibility when text sits on a busy photo. Deferred until a deck needs
  it; the reference deck does not.
- **`<Column>` background** — tinted side panels. No reference case yet.
- **`<Column align/justify>`** — block/inline alignment within a column. No
  reference case yet.
- **Image crop UX** — `crop` shipped in PR 2 but only the IJF reaction shots
  use it lightly; revisit if a deck needs interactive cropping.
- **Speaker notes round-trip** — JSON has `notesPage`; not modeled in TSX yet.
- **Step/animation parity** — out of scope here; `step` already exists.

## Open follow-ups

None blocking. Confirmed answers:

1. Default theme: themeless until declared.
4. Auto-scrim on backgrounds: deferred (see Future work).
10. Default `<Image fit>`: `contain`.
16. Sequencing: PR 1 = theme + background + inline runs; PR 2 = image fit +
    slide align; PR 3 = reader.
17. No back-compat. `<Slide><Image/></Slide>` is content, not background.
