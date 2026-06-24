import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Points to the bundled skills in the npm package
export const SKILLS_DIR = path.resolve(__dirname, "../skills");
