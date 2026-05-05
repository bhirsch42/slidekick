# slidekick

Author Google Slides decks as TSX. Push and pull from real, editable Slides presentations.

A deck is a TS function that returns an array of `<Slide>` elements. A custom JSX runtime walks the typed component tree and emits Slides API `batchUpdate` requests — slides become real text boxes, fully editable in Google Slides.

## Status

Early. Layouts are intentionally minimal. The component vocabulary is small on purpose — easy for an AI to author against, easy for a human to read.

## Quickstart

```sh
bun add -g github:bhirsch42/slidekick   # global CLI

# one-time: OAuth credentials (see "OAuth setup" below)
cp .env.example .env && $EDITOR .env    # or export GOOGLE_CLIENT_ID/SECRET in your shell
slidekick auth login                    # cache a token at ~/.config/slidekick/token.json

slidekick init my-deck                  # scaffold a deck project
cd my-deck
bun install
slidekick dev                           # local HTML preview, hot-reloads
slidekick new deck.tsx --title "Q4"     # create a new Slides deck
slidekick push deck.tsx --id <id|url>   # overwrite an existing deck
slidekick pull <id|url> -o deck.tsx     # round-trip a deck back to TSX
slidekick agent                         # AI authoring instructions
```

slidekick installs straight from GitHub — no npm publish yet. The CLI bundle is committed so installs work without a build step.

## A deck looks like this

```tsx
import { Slide, Title, Subtitle, Bullets, Bullet, Columns, Column, Heading } from "slidekick";

export default function deck() {
  return [
    <Slide>
      <Title>Hello, slidekick</Title>
      <Subtitle>Author decks as TSX. Push to Google Slides.</Subtitle>
    </Slide>,
    <Slide>
      <Title>Why slidekick</Title>
      <Bullets>
        <Bullet>Slides are code, diffable and reviewable</Bullet>
        <Bullet>An AI sidekick can author and revise them</Bullet>
        <Bullet>Output is a real Slides deck — collaboratively editable</Bullet>
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
          <Heading>slidekick pushes</Heading>
          <Bullets>
            <Bullet>Local HTML preview while editing</Bullet>
            <Bullet>Slides API batchUpdate on push</Bullet>
          </Bullets>
        </Column>
      </Columns>
    </Slide>,
  ];
}
```

Component vocabulary is fully typed: `<Title src="…">` is a compile error, `<Bullets><Title/></Bullets>` is a compile error.

## Component vocabulary

| Component | Purpose |
|---|---|
| `<Slide>` | The slide container. Children stack vertically. |
| `<Columns>` / `<Column weight?>` | Horizontal split inside a slide. |
| `<Title>` / `<Subtitle>` / `<Heading>` | Fixed-height text. |
| `<Bullets>` / `<Bullet>` | Bullet list. |
| `<Text>` | Paragraph text. |
| `<Image src>` | Image (public HTTPS URL). |
| `<Quote attribution?>` | Pull quote, optionally attributed. |

The renderer owns layout — no x/y coordinates in your deck.

## OAuth setup

You need a Google Cloud project with:

- **Google Slides API** enabled
- **Google Drive API** enabled
- An OAuth 2.0 client with `http://localhost:4242/oauth2callback` as a redirect URI
- These scopes on the OAuth consent screen:
  - `https://www.googleapis.com/auth/presentations`
  - `https://www.googleapis.com/auth/drive.file`

Put credentials in `.env` (Bun auto-loads it) or your shell:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4242/oauth2callback
```

Then `slidekick auth login`. Token is cached at `~/.config/slidekick/token.json`.

## Tests

```sh
bun test
```

Shape tests for layout and the Slides writer always run. Live round-trip tests (`tests/roundtrip.test.ts`) hit the real Slides API: they create a temporary presentation, push a deck, pull it back, assert structure, then delete the presentation. They auto-skip when no `.env` or no cached token is present.

## Architecture

- **JSX runtime** (`src/jsx-runtime.ts`) — generic `jsx<P,R>` factory; component prop types flow through.
- **Components** (`src/components.ts`) — typed factory functions returning a discriminated union of node kinds.
- **Layout** (`src/layout.ts`) — pure function: `Deck → Placed[][]`, inch-based bboxes (16:9 = 13.333" × 7.5").
- **Slides writer** (`src/slides_writer.ts`) — `Deck → batchUpdate requests`.
- **Slides reader** (`src/slides_reader.ts`) — `presentations.get → Deck → TSX source`.
- **Local preview** (`src/html.ts`) — Placed[][] → HTML; never touches Slides.
- **CLI** (`src/cli.ts`) — bundled into a single Bun executable via `scripts/build.ts`.

## Built with

- [Bun](https://bun.sh) — runtime, package manager, bundler
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) — Slides + Drive API client
- [commander](https://github.com/tj/commander.js) — CLI parsing

## License

MIT
