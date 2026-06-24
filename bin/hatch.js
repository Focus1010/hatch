#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { install } from "../src/installer/install.js";
import { update } from "../src/installer/update.js";
import { list } from "../src/installer/list.js";
import { detect } from "../src/detector/detect.js";

const LOGO = `
${chalk.yellow("  🐣 hatch")}
  ${chalk.dim("from idea to deployed dapp on Base")}
`;

program
  .name("hatch")
  .description("AI skill layer for building and deploying dapps on Base")
  .version("0.1.0");

program
  .command("install")
  .description("Install Hatch skills into your AI coding environment")
  .option("--cursor", "Force install for Cursor only")
  .option("--claude", "Force install for Claude Code only")
  .option("--codex", "Force install for Codex only")
  .option("--all", "Install for all detected tools")
  .action(async (options) => {
    console.log(LOGO);
    const detected = await detect();
    await install(detected, options);
  });

program
  .command("update")
  .description("Update Hatch skills to the latest version")
  .action(async () => {
    console.log(LOGO);
    await update();
  });

program
  .command("list")
  .description("List all installed Hatch skills")
  .action(async () => {
    console.log(LOGO);
    await list();
  });

program
  .command("detect")
  .description("Detect which AI coding tools are installed on your machine")
  .action(async () => {
    console.log(LOGO);
    const tools = await detect();
    if (tools.length === 0) {
      console.log(chalk.red("No supported AI coding tools detected."));
      console.log(chalk.dim("Supported: Claude Code, Cursor, Codex"));
    } else {
      console.log(chalk.green("Detected tools:"));
      tools.forEach((t) => console.log(`  ${chalk.yellow("→")} ${t.name} ${chalk.dim(`(${t.configPath})`)}`));
    }
  });

// Default: show help
if (process.argv.length === 2) {
  console.log(LOGO);
  program.help();
}

program.parse();
