// The garden's check. One entry point for every problem.
//
//   bun judge/check.ts <problem> --base <sha>      judge this commit against <sha> (exit 0 passed, 1 failed, 2 usage)
//   bun judge/check.ts <problem|all> --score       the current agent's mean score on fixed seeds (all: the sum)
//   bun judge/check.ts <problem> --picture <stem>  draw the current agent on the first fixed seed (<stem>.svg or .png)
//
// --base runs the base's agent and this commit's agent on the same three seeds, derived from this
// commit's sha, and passes when this commit's mean score is higher. The last stdout line is JSON
// (with --score, a bare number).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { FIXED_SEEDS, problems, scoreModule } from "./problems";
import { seedsFor } from "./seed";

// An agent runs inside the judge's process, so its source is held to a few rules: type imports only,
// no dynamic code or process access, and no reassigning built-ins or prototypes (which could bend the
// judge's own arithmetic). People still read every kept diff.
const RULES: [RegExp, string][] = [
  [/\bimport\s+(?!type\b)/, "only `import type` is allowed"],
  [/\bimport\s*\(|\brequire\s*\(/, "no dynamic import or require"],
  [/\b(globalThis|process|Bun|eval)\b|\bFunction\s*\(/, "no globalThis, process, Bun, eval or Function()"],
  [/\b(prototype|defineProperty|__proto__|setPrototypeOf)\b/, "no prototypes or property definitions"],
  [/\b(Math|Object|Array|Number|JSON|Float64Array|Float32Array|Uint8Array|Int32Array|Map|Set|performance|Date|String)\s*\.\s*\w+\s*(=(?!=)|\+=|-=|\*=|\/=)/, "no reassigning built-ins"],
];
export function ruleBroken(source: string): string | null {
  const code = source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [re, why] of RULES) if (re.test(code)) return why;
  return null;
}

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf-8" }).trim();
const load = (file: string) => import(resolve(file));

if (!import.meta.main) { /* imported for ruleBroken */ } else {
const [name, ...args] = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const usage = () => { console.error(`usage: bun judge/check.ts <${Object.keys(problems).join("|")}> --base <sha> | --score | --picture <stem>`); process.exit(2); };

if (name === "all" && args.includes("--score")) {
  let sum = 0;
  for (const p of Object.values(problems)) sum += scoreModule(p, await load(p.agent), FIXED_SEEDS).mean;
  console.log(sum.toFixed(6));
  process.exit(0);
}
const p = problems[name];
if (!p) usage();
try {
  if (args.includes("--score")) {
    console.log(scoreModule(p, await load(p.agent), FIXED_SEEDS).mean.toFixed(6));
  } else if (flag("--picture")) {
    const o = p.run(await load(p.agent), FIXED_SEEDS[0], 10_000).picture(), file = `${flag("--picture")}.${o.ext}`;
    writeFileSync(file, o.data);
    console.log(JSON.stringify({ picture: file }));
  } else if (flag("--base")) {
    const base = git("rev-parse", "--verify", `${flag("--base")}^{commit}`), head = git("rev-parse", "HEAD");
    const dir = mkdtempSync(join(tmpdir(), `${name}-base-`));
    writeFileSync(join(dir, "agent.ts"), git("show", `${base}:${p.agent}`));
    const seeds = seedsFor(head, 3);
    const broken = ruleBroken(readFileSync(p.agent, "utf-8"));
    if (broken) {
      console.log(`${name}: ${p.agent} breaks a rule: ${broken}`);
      console.log(JSON.stringify({ problem: name, passed: false, rule: broken }));
      process.exit(1);
    }
    const b = scoreModule(p, await load(join(dir, "agent.ts")), seeds);
    const h = scoreModule(p, await load(p.agent), seeds);
    const passed = h.mean > b.mean;
    console.log(`${name}: base ${b.mean.toFixed(4)}  head ${h.mean.toFixed(4)}  on seeds ${seeds.join(", ")}`);
    console.log(JSON.stringify({ problem: name, passed, base: { sha: base, ...b }, head: { sha: head, ...h }, seeds }));
    process.exit(passed ? 0 : 1);
  } else usage();
} catch (e) {
  console.error(String(e));
  console.log(JSON.stringify({ problem: name, passed: false, error: String(e) }));
  process.exit(args.includes("--base") ? 1 : 2);
}
}
