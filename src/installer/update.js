import chalk from "chalk";
import ora from "ora";
import { execSync } from "child_process";

export async function update() {
  const spinner = ora("Checking for updates...").start();
  try {
    execSync("npm install -g hatch-base@latest", { stdio: "pipe" });
    spinner.succeed("Hatch updated to latest version");
    console.log(chalk.dim('\n  Run `hatch install` to refresh your skill files\n'));
  } catch (err) {
    spinner.fail("Update failed. Try: npm install -g hatch-base@latest");
  }
}
