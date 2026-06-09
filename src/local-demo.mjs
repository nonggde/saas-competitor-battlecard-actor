import fs from "node:fs";
import path from "node:path";
import { createBattlecardRun, defaultInput, renderRunMarkdown } from "./battlecard-engine.mjs";

const inputPath = process.argv[2] || "examples/sample-input.json";
const input = fs.existsSync(inputPath)
  ? JSON.parse(fs.readFileSync(inputPath, "utf8"))
  : defaultInput();

process.env.DRY_RUN = process.env.DRY_RUN || "true";

const run = await createBattlecardRun(input, {
  onFetch: (details) => console.log(`FETCH ${JSON.stringify(details)}`)
});

const outDir = path.resolve("dist/local-demo");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "RUN.json"), JSON.stringify(run, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "BATTLECARDS.md"), renderRunMarkdown(run), "utf8");

console.log(`dryRun=${run.summary.dryRun}`);
console.log(`succeeded=${run.summary.succeeded}`);
console.log(`failed=${run.summary.failed}`);
console.log(`outputDir=${outDir}`);
