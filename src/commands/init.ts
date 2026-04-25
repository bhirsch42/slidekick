import { mkdir, writeFile, access } from "node:fs/promises";
import { join, resolve, basename } from "node:path";

export async function initCommand(dir: string | undefined): Promise<void> {
  const target = resolve(process.cwd(), dir ?? ".");
  await mkdir(target, { recursive: true });

  const deckPath = join(target, "deck.tsx");
  if (await fileExists(deckPath)) {
    console.error(`refusing to overwrite existing deck.tsx in ${target}`);
    process.exit(1);
  }

  await writeFile(deckPath, STARTER_DECK);
  await writeFile(join(target, "tsconfig.json"), STARTER_TSCONFIG);
  await writeFile(join(target, "package.json"), starterPackageJson(basename(target)));
  await writeFile(join(target, ".gitignore"), STARTER_GITIGNORE);

  console.log(`scaffolded slidekick deck in ${target}`);
  console.log("");
  console.log("next:");
  console.log(`  cd ${dir ?? "."}`);
  console.log("  bun install");
  console.log("  bun slidekick dev      # live preview");
  console.log("  bun slidekick build    # render to out/deck.pptx");
  console.log("  bun slidekick agent    # AI authoring instructions");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const STARTER_DECK = `import { Slide, Title, Subtitle, Bullets, Bullet } from "slidekick";

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
  ];
}
`;

const STARTER_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "jsxImportSource": "slidekick",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
`;

function starterPackageJson(name: string): string {
  const safeName = name.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "deck";
  return `{
  "name": "${safeName}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "slidekick dev",
    "build": "slidekick build"
  },
  "dependencies": {
    "slidekick": "github:bhirsch42/slidekick"
  }
}
`;
}

const STARTER_GITIGNORE = `node_modules
out/
*.pptx
.DS_Store
`;
