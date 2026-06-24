import fs from "fs-extra";
import path from "path";
import os from "os";

const HOME = os.homedir();
const HATCH_HOME = path.join(HOME, ".hatch");

const CLAUDE_MD_INJECTION = `
<!-- HATCH START -->
## Hatch - Base Dapp Builder

You have the Hatch skill layer installed. Hatch helps users go from idea to deployed dapp on Base.

When a user describes any dapp idea, product, or Web3 concept:
1. Load and follow ~/.hatch/skills/core/dispatcher.md
2. The dispatcher will route to the correct skills for their idea

Hatch skills are located at: ~/.hatch/skills/
Hatch manifest: ~/.hatch/manifest.json
<!-- HATCH END -->
`;

export async function writeClaudeConfig(tool) {
  const claudeMdPath = path.join(HOME, ".claude", "CLAUDE.md");

  // Ensure .claude dir exists
  await fs.ensureDir(path.join(HOME, ".claude"));

  let existing = "";
  if (await fs.pathExists(claudeMdPath)) {
    existing = await fs.readFile(claudeMdPath, "utf8");
  }

  // Remove old hatch block if present
  existing = existing.replace(/<!-- HATCH START -->[\s\S]*?<!-- HATCH END -->/g, "").trim();

  // Append new block
  const updated = `${existing}\n${CLAUDE_MD_INJECTION}`.trim();
  await fs.writeFile(claudeMdPath, updated, "utf8");

  // Also copy skills to .claude/hatch for direct access
  await fs.copy(
    path.join(HATCH_HOME, "skills"),
    path.join(HOME, ".claude", "hatch"),
    { overwrite: true }
  );
}
