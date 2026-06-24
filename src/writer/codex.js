import fs from "fs-extra";
import path from "path";
import os from "os";

const HOME = os.homedir();
const HATCH_HOME = path.join(HOME, ".hatch");

const CODEX_INJECTION = `
# Hatch - Base Dapp Builder
# https://github.com/basedfocus/hatch

You have the Hatch skill layer installed. When a user describes any dapp idea, product,
or Web3 concept, load the dispatcher from ~/.hatch/skills/core/dispatcher.md and follow it.

Hatch skills: ~/.hatch/skills/
`;

export async function writeCodexConfig(tool) {
  const codexDir = path.join(HOME, ".codex");
  await fs.ensureDir(codexDir);

  const instructionsPath = path.join(codexDir, "instructions.md");
  let existing = "";

  if (await fs.pathExists(instructionsPath)) {
    existing = await fs.readFile(instructionsPath, "utf8");
  }

  existing = existing.replace(/# Hatch[\s\S]*?hatch\/\n/g, "").trim();
  const updated = `${existing}\n\n${CODEX_INJECTION}`.trim();
  await fs.writeFile(instructionsPath, updated, "utf8");

  await fs.copy(
    path.join(HATCH_HOME, "skills"),
    path.join(codexDir, "hatch"),
    { overwrite: true }
  );
}
