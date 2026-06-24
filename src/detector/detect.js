import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

const HOME = os.homedir();

// Known config paths for each supported tool
const TOOL_SIGNATURES = [
  {
    name: "Claude Code",
    id: "claude",
    configPath: path.join(HOME, ".claude"),
    skillTarget: path.join(HOME, ".claude", "CLAUDE.md"),
    skillDir: path.join(HOME, ".claude", "hatch"),
    detect: () => fs.pathExists(path.join(HOME, ".claude")),
  },
  {
    name: "Cursor",
    id: "cursor",
    configPath: path.join(HOME, ".cursor"),
    skillTarget: null, // written per-project via .cursorrules
    skillDir: path.join(HOME, ".cursor", "hatch"),
    detect: async () => {
      const globalExists = await fs.pathExists(path.join(HOME, ".cursor"));
      const appExists = await fs.pathExists("/Applications/Cursor.app");
      const appExistsLinux = await fs.pathExists("/usr/bin/cursor");
      return globalExists || appExists || appExistsLinux;
    },
  },
  {
    name: "Codex",
    id: "codex",
    configPath: path.join(HOME, ".codex"),
    skillTarget: path.join(HOME, ".codex", "instructions.md"),
    skillDir: path.join(HOME, ".codex", "hatch"),
    detect: () => fs.pathExists(path.join(HOME, ".codex")),
  },
];

export async function detect() {
  const found = [];

  for (const tool of TOOL_SIGNATURES) {
    try {
      const exists = await tool.detect();
      if (exists) {
        found.push(tool);
        console.log(chalk.dim(`  ✓ Found ${tool.name}`));
      }
    } catch {
      // silently skip
    }
  }

  return found;
}

export { TOOL_SIGNATURES };
