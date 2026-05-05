export async function agentCommand() {
    process.stdout.write(AGENT_INSTRUCTIONS);
}
const AGENT_INSTRUCTIONS = `# Authoring slidekick decks

A slidekick deck is a TSX file that default-exports a function returning an
array of <Slide> elements. Each slide is composed from slidekick's component
vocabulary — a custom JSX runtime maps the tree to real .pptx text boxes.

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
- <Image src>      an image. src is a path or URL.
- <Quote attribution?>  a pull quote, optionally attributed.
- <Group>          layout-transparent container that auto-numbers
                   reveal steps for its direct children.

## Progressive reveal

Every component accepts an optional \`step\` prop (number). In the live
preview, only elements with \`step <= currentStep\` are visible; arrow
keys advance the step. In .pptx output, all steps are composed (static).

- step on a <Bullet>: that bullet appears at the given step.
- step on <Bullets>: the whole list appears at that step (children
  inherit unless they set their own).
- <Group> with no step: assigns 1, 2, 3… to its direct children in
  source order. Use this for the common "reveal one at a time" case.
- <Group step={N}>: groups its children at step N (no auto-numbering).

Examples:

\`\`\`tsx
// reveal bullets one at a time
<Bullets>
  <Bullet step={1}>First</Bullet>
  <Bullet step={2}>Second</Bullet>
  <Bullet step={3}>Third</Bullet>
</Bullets>

// auto-number a sequence of slide-level blocks
<Group>
  <Heading>Setup</Heading>
  <Text>Then the punchline.</Text>
  <Image src="chart.png" />
</Group>
\`\`\`

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

## Editing workflow

The user runs \`slidekick dev\` for a live HTML preview that hot-reloads on
save. \`slidekick build\` produces a real .pptx in out/deck.pptx, editable
in Google Slides and PowerPoint.
`;
//# sourceMappingURL=agent.js.map