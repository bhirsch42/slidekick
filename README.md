# slidekick

Author slide decks as TSX with an AI sidekick. Renders to `.pptx` (Google Slides–compatible).

A deck is a TS function that returns an array of `<Slide>` elements. A custom JSX runtime walks the tree and emits real PowerPoint text boxes via [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) — no images, no screenshots, slides are editable in Google Slides and PowerPoint.

## Status

Early. Layouts are intentionally minimal. The component vocabulary is small on purpose — easy for an AI to author against, easy for a human to read.

## Quickstart

```sh
bun install
bun run build
./dist/cli.js init my-deck
cd my-deck
# (until published to npm: edit package.json to point slidekick at a file: path)
bun install
bun slidekick dev      # live HTML preview, hot-reloads on save
bun slidekick build    # writes out/deck.pptx
bun slidekick agent    # prints AI authoring instructions
```

## A deck looks like this

```tsx
import { Slide, Title, Subtitle, Bullets, Bullet, Columns, Column, Heading } from "slidekick";

export default function deck() {
  return [
    <Slide>
      <Title>Hello, slidekick</Title>
      <Subtitle>Author decks as TSX. Render to .pptx.</Subtitle>
    </Slide>,
    <Slide>
      <Title>Why slidekick</Title>
      <Bullets>
        <Bullet>Slides are code, diffable and reviewable</Bullet>
        <Bullet>An AI sidekick can author and revise them</Bullet>
        <Bullet>Output is a real .pptx — Google Slides compatible</Bullet>
      </Bullets>
    </Slide>,
    <Slide>
      <Title>How it works</Title>
      <Columns>
        <Column>
          <Heading>You write</Heading>
          <Bullets>
            <Bullet>deck.tsx returning Slide[]</Bullet>
            <Bullet>High-level components, no pixel math</Bullet>
          </Bullets>
        </Column>
        <Column>
          <Heading>slidekick renders</Heading>
          <Bullets>
            <Bullet>Live HTML preview while editing</Bullet>
            <Bullet>pptxgenjs → editable .pptx on build</Bullet>
          </Bullets>
        </Column>
      </Columns>
    </Slide>,
  ];
}
```

## Component vocabulary

| Component | Purpose |
|---|---|
| `<Slide>` | The slide container. Children stack vertically. |
| `<Columns>` / `<Column weight?>` | Horizontal split inside a slide. |
| `<Title>` / `<Subtitle>` / `<Heading>` | Fixed-height text. |
| `<Bullets>` / `<Bullet>` | Bullet list. |
| `<Text>` | Paragraph text. |
| `<Image src>` | Image, contained in its bbox. |
| `<Quote attribution?>` | Pull quote, optionally attributed. |

The renderer owns layout — no x/y coordinates in your deck. Title/Subtitle/Heading take fixed heights; everything else flexes to fill the remaining space. `<Columns>` splits horizontal width by weight (default 1).

## Architecture

- **JSX runtime** (`src/jsx-runtime.ts`) — exports `jsx`, `jsxs`, `jsxDEV`, `Fragment`. Each component is a marker function returning `{ type, props, children }`. No React.
- **Layout** (`src/render/layout.ts`) — walks the tree once, producing inch-based bboxes (16:9 = 13.333" × 7.5").
- **Renderers** consume the same `Placed[]` IR — `render/pptx.ts` for output, `render/html.ts` for live preview. Same numbers in both.
- **CLI** (`src/cli.ts`) — bundled into a single Bun executable via `scripts/build.ts`.

## Built with

- [Bun](https://bun.sh) — runtime, package manager, bundler
- [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) — pptx generation
- [commander](https://github.com/tj/commander.js) — CLI parsing

## License

MIT
