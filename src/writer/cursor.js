import fs from "fs-extra";
import path from "path";
import os from "os";

const HOME = os.homedir();
const HATCH_HOME = path.join(HOME, ".hatch");

const CURSORRULES_INJECTION = `
# Hatch - Base Dapp Builder
# https://github.com/basedfocus/hatch

You have the Hatch skill layer installed. When a user describes any dapp idea, product,
or Web3 concept, load the dispatcher from ~/.hatch/skills/core/dispatcher.md and follow it.

Hatch skills: ~/.hatch/skills/
`;

export async function writeCursorConfig(tool) {
  // Write to global Cursor rules
  const cursorRulesPath = path.join(HOME, ".cursor", "rules", "hatch.mdc");
  await fs.ensureDir(path.join(HOME, ".cursor", "rules"));
  await fs.writeFile(cursorRulesPath, CURSORRULES_INJECTION.trim(), "utf8");

  // Also copy skills for direct access
  await fs.copy(
    path.join(HATCH_HOME, "skills"),
    path.join(HOME, ".cursor", "hatch"),
    { overwrite: true }
  );
}

// Call this from a project to inject .cursorrules locally
export async function writeProjectCursorRules(projectDir) {
  const cursorrules = path.join(projectDir, ".cursorrules");
  await fs.writeFile(cursorrules, CURSORRULES_INJECTION.trim(), "utf8");
}
