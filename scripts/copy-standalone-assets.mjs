import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  throw new Error("Missing .next/standalone. Run next build first.");
}

const standaloneNext = join(standalone, ".next");
mkdirSync(standaloneNext, { recursive: true });

cpSync(join(root, ".next", "static"), join(standaloneNext, "static"), { recursive: true });
cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });

console.log("Copied .next/static and public into .next/standalone.");
