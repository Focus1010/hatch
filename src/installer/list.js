import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

const HATCH_HOME = path.join(os.homedir(), ".hatch");

export async function list() {
  const manifestPath = path.join(HATCH_HOME, "manifest.json");

  if (!(await fs.pathExists(manifestPath))) {
    console.log(chalk.red("  Hatch is not installed. Run `hatch install` first."));
    return;
  }

  const manifest = await fs.readJson(manifestPath);

  console.log(chalk.bold(`  Hatch v${manifest.version}`));
  console.log(chalk.dim(`  Installed: ${new Date(manifest.installedAt).toLocaleDateString()}\n`));

  const groups = {};
  for (const skill of manifest.skills) {
    const [group, name] = skill.split("/");
    if (!groups[group]) groups[group] = [];
    groups[group].push(name);
  }

  for (const [group, skills] of Object.entries(groups)) {
    console.log(chalk.yellow(`  ${group}/`));
    for (const skill of skills) {
      console.log(chalk.dim(`    → ${skill}`));
    }
    console.log();
  }
}
