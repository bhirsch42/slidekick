#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { agentCommand } from "./commands/agent.js";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";

const program = new Command();

program
  .name("slidekick")
  .description("Author slide decks as TSX with an AI sidekick. Renders to .pptx.")
  .version("0.0.1");

program
  .command("init")
  .description("Scaffold a new slidekick deck project")
  .argument("[dir]", "directory to create (defaults to current dir)")
  .action(initCommand);

program
  .command("agent")
  .description("Print agent-friendly instructions for authoring a deck")
  .action(agentCommand);

program
  .command("dev")
  .description("Start a live-preview server while editing slides")
  .option("-p, --port <port>", "port to serve on", "5179")
  .option("-e, --entry <entry>", "deck entry file", "deck.tsx")
  .action(devCommand);

program
  .command("build")
  .description("Render the deck to a .pptx file")
  .option("-e, --entry <entry>", "deck entry file", "deck.tsx")
  .option("-o, --out <out>", "output .pptx path", "out/deck.pptx")
  .action(buildCommand);

program.parseAsync(process.argv);
