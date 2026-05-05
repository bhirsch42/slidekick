# slidekick style guide

A working set of conventions for building image-led, editorial decks with
slidekick — distilled from the IJF reference deck. Apply them by default.
Break them on purpose.

## The look, in one paragraph

Dark canvas. Serif type. Photographs do the heavy lifting and bleed off the
page; words get out of the way. Most slides are either a full-bleed image, a
quiet pull quote, or a portrait + caption pair. There is no chrome, no
decorative line work, no logo lockup on every slide. Restraint is the style.

## Theme

Set it once at the top of the deck. Never re-declare per slide.

```ts
theme: {
  background: "#0a0a0a",       // near-black, not pure black
  text:       "#f5f0e6",       // warm off-white, not #fff
  accent:     "#9a8a6a",       // muted, used by <Cite>
  fonts: { body: "Times New Roman", display: "Times New Roman" },
}
```

- **Background.** Near-black (`#0a0a0a` / `#111`) reads as photographic film
  rather than UI. Avoid `#000` — it crushes shadows in projected rooms.
- **Text.** Warm off-white over the warm dark beats stark `#fff`. Match the
  warmth of your photographs.
- **Accent.** One muted hue, used only by `<Cite>` for credits and dates.
  Resist using it for emphasis — that's `<Strong>`'s job.
- **Fonts.** One serif family for both `body` and `display`. Mixing display
  serifs with body sans is a magazine convention; this deck style is closer
  to a monograph.

## Slide patterns

Pick the one that fits the beat. In a 30-slide deck, expect ~60% image
slides, ~25% quote slides, ~15% structured (columns, lists). Title slides
are rare — one to open, optionally one to close.

### 1. Title (centered)

Use once at the open and once at the close. Keep the title under ~40
characters; the subtitle is a one-line credit, often a `<Cite>`.

```tsx
<Slide align="center">
  <Title>Image-led decks, in TSX.</Title>
  <Subtitle>
    A slidekick parity demo{"\n"}
    <Cite>Authored as code, rendered to Google Slides</Cite>
  </Subtitle>
</Slide>
```

### 2. Full-bleed image with anchored text

The dominant pattern. Background image + a single short label or title
anchored to the top or bottom. **Never** dump a paragraph over a photo.

```tsx
<Slide background={{ image: STREET }} align="end">
  <Title>Streets at golden hour</Title>
</Slide>
```

- Use `align="end"` (bottom) for captions and titles. `align="start"` (top)
  for floater labels in all caps.
- One textual element, max two. If you need three, break the slide.

### 3. Pull quote

The quiet beat between image runs. Always vertically centered on the
slide — wrap with `<Slide align="center">`. One quote per slide. Keep
quotes under ~30 words; longer ones lose the room.

There is **no `<Quote>` component in slidekick**. A pull quote is two
centered `<Subtitle>` paragraphs — the quote in `<Em>` and the
attribution in `<Cite>`. Define a project-level `<PullQuote>` (see
"Custom components" below) and use it everywhere:

```tsx
<PullQuote by="Beatrice Warde, 1932">
  “When the typography is invisible, the reader hears the writer’s voice.”
</PullQuote>
```

Which expands to:

```tsx
<Slide align="center">
  <Subtitle align="center">
    <Em>“When the typography is invisible, the reader hears the writer’s voice.”</Em>
  </Subtitle>
  <Subtitle align="center">
    <Cite>— Beatrice Warde, 1932</Cite>
  </Subtitle>
</Slide>
```

- Always wrap the quote in curly quotation marks (`“ ”`), not straight `"`.
- Attribution carries the year. A bare name reads as graffiti; a dated name
  reads as a citation.
- For statistics or paraphrased findings, use `<Subtitle>` + `<Cite>` for
  the source instead of `<Quote>`. `<Quote>` is for words people said.

### 4. Portrait + caption (two-column)

The interview pattern. Portrait left, structured caption right. Default
weights `2:3` — the photo gets less width than the prose, because the prose
*reads* and the photo *sits*.

```tsx
<Slide>
  <Columns>
    <Column weight={2}>
      <Image src={PORTRAIT} fit="cover" />
    </Column>
    <Column weight={3}>
      <Heading>On the subject</Heading>
      <Subtitle>
        Featured guest{"\n"}
        <Cite>Photographed on assignment, 2024</Cite>
      </Subtitle>
      <Bullets>
        <Bullet>Author of <Em>Notes on Light</Em> (2019)</Bullet>
        <Bullet><Strong>Resident</Strong> at the Atelier program</Bullet>
      </Bullets>
    </Column>
  </Columns>
</Slide>
```

- Portrait images: always `fit="cover"`. Aspect ratio mismatch is the
  caller's problem, not the reader's.
- Bullets: 3–5 max. Each under ~10 words.

### 5. Image grid

Three-up `<Columns>` with `cover` images and a tight gap (`0.2`). Use to
imply a sequence, a series, or a contrast set. No captions on grids — if
each tile needs a caption, it's not a grid, it's three slides.

```tsx
<Columns gap={0.2}>
  <Column><Image src={A} fit="cover" /></Column>
  <Column><Image src={B} fit="cover" /></Column>
  <Column><Image src={C} fit="cover" /></Column>
</Columns>
```

### 6. Closer (centered)

Mirror the opener. Single word or phrase (`fin.`, `thanks.`, `notes →`)
plus a `<Cite>` line. Resist contact info — that lives on the deck's
metadata, not on a slide.

## Typography

- **Title** is for slide-defining text only. One per slide, max.
- **Subtitle** is the workhorse for label text under a title, captions, and
  mixed-run editorial paragraphs (the `<Cite>` carrier).
- **Heading** belongs inside `<Column>`s. Don't use it at the slide root —
  if the slide needs a heading, it needs a `<Title>`.
- **Text** is for prose. Avoid prose. If you reach for `<Text>`, ask
  whether the slide could be a quote, a bullet list, or two slides.
- **Bullet** items end without periods, use sentence case, and start with a
  noun or verb — never an article.

### Inline runs

Inline span elements compose inside any text-bearing component. The four
flavors:

- `<Em>` — italic, for titles of works (*Notes on Light*) and for
  rhetorical lift.
- `<Strong>` — bold weight 700, for hard emphasis. Use ≤1 per paragraph.
- `<Cite>` — italic + ~75% size + accent color. Dedicated to
  attributions, dates, photo credits, and standfirst lines under a name.
- `<Span>` — escape hatch for one-off color, weight, size, or font.
  Reserve for floater labels overlaid on photographs.

Newlines inside text components stay as `{"\n"}`. There is no `<Br/>`.

### When to reach for `<Span>`

`<Span>` is the only inline that takes arbitrary style. Use it for the
"floater label" pattern — a single bold word or phrase laid over a photo
in the deck's accent color or pure white:

```tsx
<Slide background={{ image: ARCH }} align="start">
  <Subtitle>
    <Span weight={700} size={36} color="#f5f0e6">ARCH   ETYPE</Span>
  </Subtitle>
</Slide>
```

Don't use `<Span>` to recreate `<Em>`, `<Strong>`, or `<Cite>`.

## Layout rules

- **One idea per slide.** If you can describe a slide with "and", split it.
- **Padding is fixed.** Don't try to game it with empty `<Text>` rows.
- **`<Slide align>` is for backgrounded slides.** Use it to anchor a
  single piece of content top/center/bottom against a full-bleed image.
  Don't use `align` on slides that already fill the area with stacked
  content — flex layout handles that.
- **`<Columns>` only at the slide root**, or directly under a `<Title>`.
  Never nest `<Columns>` inside a `<Column>`.

### Vertical centering

Vertical centering is a property of the **slide**, not the component.
Use `<Slide align="center">` to anchor the whole content stack to the
middle of the page; use `align="end"` to anchor it to the bottom and
`align="start"` to pin it to the top.

This is the only mechanism. Don't try to fake centering with an empty
`<Heading>` above your content, and don't expect components to center
themselves — `<Quote>` placed in a default `<Slide>` will sit at the top
of the page, which is almost never what you want. Pull-quote slides
always want `align="center"`:

```tsx
<Slide align="center">
  <Quote attribution="…">…</Quote>
</Slide>
```

`align` only takes effect when the natural height of the content is less
than the slide's content area. On crowded slides (multiple stacked
elements that already fill the area) it's a no-op.

## Imagery

- Use full-bleed (`<Slide background={{ image }}>`) for hero shots.
- Use content `<Image>` (inside `<Slide>` or `<Column>`) for portraits and
  artifact shots that need to coexist with text.
- Default `fit` is `contain` (preserves aspect, may letterbox). Use
  `fit="cover"` for portraits, grids, and any image that should fill its
  box without letterbox bars.
- Source images should be at least 1600px on the long edge for projection.
- Public HTTPS URLs only. Slides will refuse to import private or
  redirect-walled hosts.

## Custom components

slidekick is a tiny set of primitives. The expectation is that every
deck (or every team) defines its own components on top — the same way a
React app defines its own components on top of `div` and `span`.

Two patterns:

### Single-node component

A function that returns one slidekick node. Use this for slide
templates, inline-text patterns, and any component you want to drop in
as a JSX element.

```tsx
// pull-quote.tsx
import { Slide, Subtitle, Em, Cite } from "slidekick";
import type { SlideNode, TextChildren } from "slidekick";

export function PullQuote(props: { children: TextChildren; by: string }): SlideNode {
  return (
    <Slide align="center">
      <Subtitle align="center"><Em>{props.children}</Em></Subtitle>
      <Subtitle align="center"><Cite>— {props.by}</Cite></Subtitle>
    </Slide>
  );
}

// deck.tsx
<PullQuote by="Beatrice Warde, 1932">
  “When the typography is invisible…”
</PullQuote>
```

This is exactly how the old built-in `<Quote>` worked — it was deleted
because every project should own its own pull-quote styling.

### Multi-slide component

A function that returns `SlideNode[]`. Use this for sections, chapter
dividers, or any pattern that produces several slides at once. Slidekick
flattens nested arrays in deck output, so you can either spread the call
or use it as a JSX element directly:

```tsx
function Section({ title }: { title: string }): SlideNode[] {
  return [
    <Slide align="center"><Title>{title}</Title></Slide>,
    <Slide><Subtitle><Cite>(continues)</Cite></Subtitle></Slide>,
  ];
}

export default function deck() {
  return [
    ...Section({ title: "Part one" }),  // explicit spread
    <Section title="Part two" />,        // or JSX — array result is flattened
    <Slide><Title>End</Title></Slide>,
  ];
}
```

Fragments (`<>...</>`) are allowed and pass their children through to the
nearest collector — useful for grouping inline elements or conditional
chunks of slides.

### When to extract

Extract a component the second time you write the same shape. Common
candidates per project:

- `<PullQuote by>` — branded pull-quote slide.
- `<TitleSlide>` / `<EndSlide>` — opener and closer with project chrome.
- `<PortraitColumn>` — a `<Column>` with a fixed-aspect portrait above
  caption text.
- `<ImageGrid items>` — three- or four-up image array with captions.
- `<Stat number unit caption>` — large numeral + small label, for
  data-driven slides.

Keep custom components in `components/` next to `deck.tsx`. Don't import
them across decks; copy them. Each deck owns its visual vocabulary.

## What to avoid

- Sans-serif body type (breaks the editorial register).
- Mixed background colors across slides (use the theme).
- More than one `<Title>` on a slide.
- Bullets inside a `<Quote>`.
- Decorative `<Strong>` runs scattered through prose for "energy".
- Pure `#000` backgrounds and pure `#fff` text.
- Logos or footers on every slide. Restraint is the brand.
