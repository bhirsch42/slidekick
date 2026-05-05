export const AGENT_INSTRUCTIONS = `# Authoring slidekick decks

A slidekick deck is a TSX file that default-exports a function returning an
array of <Slide> elements. The deck is pushed to Google Slides via the
slidekick CLI — slides are real, editable text boxes (not images).

## File shape

\`\`\`tsx
import { Slide, Title, Subtitle, Bullets, Bullet } from "slidekick";

export default function deck() {
  return [
    <Slide>
      <Title>Slide one</Title>
      <Subtitle>Optional subtitle</Subtitle>
    </Slide>,
    <Slide>
      <Title>Slide two</Title>
      <Bullets>
        <Bullet>First point</Bullet>
        <Bullet>Second point</Bullet>
      </Bullets>
    </Slide>,
  ];
}
\`\`\`

## Vocabulary

Container:
- <Slide>          the canonical slide. Children stack vertically.

Layout:
- <Columns>        wraps <Column> children, splits horizontally.
- <Column weight?> a column inside <Columns>. Optional weight for unequal split.

Content:
- <Title>          one short line, ~60 chars max. Big, bold.
- <Subtitle>       sits under a <Title>.
- <Heading>        section heading, e.g. inside a <Column>.
- <Bullets>        wraps <Bullet> children.
- <Bullet>         one bullet point.
- <Text>           a paragraph or short prose.
- <Image src>      an image. src must be a public HTTPS URL.
- <Group>          layout-transparent container that auto-numbers
                   reveal steps for its direct children (preview only).

## Composition rules

- Always wrap each slide in <Slide>.
- Put <Bullet> only inside <Bullets>.
- Put <Column> only inside <Columns>.
- Use <Columns> at the top level of a <Slide>, or after a <Title>.
- Do not use HTML tags (<div>, <h1>, etc.) — they are not supported.
- Do not pass x/y coordinates. The renderer owns layout.

## Authoring guidance

- Keep titles under 60 characters and bullets under ~10 words each.
- 5–7 bullets per slide max. Split into multiple slides if crowded.
- Prefer <Columns> over crowding a single column with too much content.
- When unsure, default to a <Slide> with a <Title> and <Bullets>.

## Workflow

The user runs:

  slidekick dev                       # local HTML preview, hot-reloads
  slidekick new deck.tsx --title "X"  # create new Slides deck
  slidekick push deck.tsx --id <id>   # overwrite an existing Slides deck
  slidekick pull <id|url> -o deck.tsx # round-trip an existing deck back to TSX

A deck ID is the long string in a Slides URL:
https://docs.google.com/presentation/d/<ID>/edit
`;
//# sourceMappingURL=agent.js.map