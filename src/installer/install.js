import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import ora from "ora";
import { TOOL_SIGNATURES } from "../detector/detect.js";
import { writeClaudeConfig } from "../writer/claude.js";
import { writeCursorConfig } from "../writer/cursor.js";
import { writeCodexConfig } from "../writer/codex.js";
import { SKILLS_DIR } from "../skills.js";

const HOME = os.homedir();
const HATCH_HOME = path.join(HOME, ".hatch");

const WRITERS = {
  claude: writeClaudeConfig,
  cursor: writeCursorConfig,
  codex: writeCodexConfig,
};

export async function install(detectedTools, options = {}) {
  const spinner = ora("Installing Hatch skills...").start();

  try {
    // Ensure ~/.hatch exists with all skills
    await fs.ensureDir(HATCH_HOME);
    await fs.copy(SKILLS_DIR, path.join(HATCH_HOME, "skills"), { overwrite: true });

    spinner.succeed("Skills copied to ~/.hatch/skills");

    // Write manifest
    await writeManifest();

    // Determine which tools to configure
    let targets = detectedTools;

    if (options.claude) targets = TOOL_SIGNATURES.filter((t) => t.id === "claude");
    if (options.cursor) targets = TOOL_SIGNATURES.filter((t) => t.id === "cursor");
    if (options.codex) targets = TOOL_SIGNATURES.filter((t) => t.id === "codex");

    if (targets.length === 0) {
      console.log(chalk.yellow("\n  No AI tools detected. Skills are saved to ~/.hatch/skills"));
      console.log(chalk.dim("  Run `hatch detect` to diagnose, or use --claude / --cursor / --codex flags\n"));
      return;
    }

    // Configure each tool
    for (const tool of targets) {
      const write = WRITERS[tool.id];
      if (write) {
        const toolSpinner = ora(`Configuring ${tool.name}...`).start();
        try {
          await write(tool);
          toolSpinner.succeed(`${tool.name} configured`);
        } catch (err) {
          toolSpinner.fail(`${tool.name} config failed: ${err.message}`);
        }
      }
    }

    console.log(`
${chalk.yellow("  🐣 Hatch is ready.")}

  ${chalk.bold("Start a new session in your AI tool and say:")}
  ${chalk.cyan('"I want to build a [your idea] on Base"')}

  ${chalk.dim("Hatch will take it from there.")}
`);
  } catch (err) {
    spinner.fail(`Install failed: ${err.message}`);
    throw err;
  }
}

async function writeManifest() {
  const manifest = {
    version: "0.1.0",
    installedAt: new Date().toISOString(),
    skills: [
      "core/dispatcher",
      "core/questionnaire",
      "core/architecture",
      "contracts/erc20",
      "contracts/erc721",
      "contracts/erc1155",
      "contracts/staking",
      "contracts/governance",
      "contracts/vesting",
      "contracts/bonding-curve",
      "contracts/vault",
      "contracts/amm",
      "auditing/checklist",
      "auditing/reentrancy",
      "auditing/oracle-manip",
      "auditing/access-control",
      "deployment/base-sepolia",
      "deployment/base-mainnet",
      "deployment/verification",
      "frontend/wagmi-scaffold",
      "frontend/miniapp",
      "frontend/farcaster-frame",
      "protocols/clanker",
      "protocols/bankr",
    ],
  };

  await fs.writeJson(path.join(HATCH_HOME, "manifest.json"), manifest, { spaces: 2 });
}
