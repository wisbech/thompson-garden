// The Flow check. Runs the base's agent and the head's agent on the same three fields, seeded
// from the commit under judgement, and passes only when the head covers more of the page.
//
//   bun judge/flow/check.ts --base <sha>      judge a commit (exit 0 passed, 1 failed, 2 usage)
//   bun judge/flow/check.ts --score           print the current agent's score (fixed seeds) on the last line
//   bun judge/flow/check.ts --svg <file>      draw the current agent on the first fixed field
//
// The last stdout line is JSON (or, with --score, a bare number).
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { run, toSvg, type FlowAgent } from "./world";
import { seedsFor } from "../seed";

export const BUDGET_MS = 10_000;
export const FIXED_SEEDS = [1, 2, 3];
const AGENT = "problems/flow/agent.ts";

export async function loadAgent(file: string): Promise<FlowAgent> {
  const mod = await import(resolve(file));
  if (typeof mod.nextSeed !== "function") throw new Error(`${file} must export nextSeed(world)`);
  return { nextSeed: mod.nextSeed };
}

export function scoreAgent(agent: FlowAgent, seeds: number[], budgetMs = BUDGET_MS) {
  const runs = seeds.map((s) => {
    const r = run(agent, s, budgetMs);
    return { seed: s, coverage: r.coverage, trails: r.trails.length, calls: r.calls, cut: r.cut };
  });
  return { mean: runs.reduce((a, r) => a + r.coverage, 0) / runs.length, runs };
}

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf-8" }).trim();

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  try {
    if (args.includes("--score")) {
      console.log(scoreAgent(await loadAgent(AGENT), FIXED_SEEDS).mean.toFixed(6));
    } else if (flag("--svg")) {
      writeFileSync(flag("--svg")!, toSvg(run(await loadAgent(AGENT), FIXED_SEEDS[0], BUDGET_MS).trails));
      console.log(JSON.stringify({ svg: flag("--svg") }));
    } else if (flag("--base")) {
      const base = git("rev-parse", "--verify", `${flag("--base")}^{commit}`), head = git("rev-parse", "HEAD");
      const dir = mkdtempSync(join(tmpdir(), "flow-base-"));
      writeFileSync(join(dir, "agent.ts"), git("show", `${base}:${AGENT}`));
      const seeds = seedsFor(head, 3);
      const b = scoreAgent(await loadAgent(join(dir, "agent.ts")), seeds);
      const h = scoreAgent(await loadAgent(AGENT), seeds);
      const passed = h.mean > b.mean;
      console.log(`base ${b.mean.toFixed(4)}  head ${h.mean.toFixed(4)}  on seeds ${seeds.join(", ")}`);
      console.log(JSON.stringify({ passed, base: { sha: base, ...b }, head: { sha: head, ...h }, seeds }));
      process.exit(passed ? 0 : 1);
    } else {
      console.error("usage: bun judge/flow/check.ts --base <sha> | --score | --svg <file>");
      process.exit(2);
    }
  } catch (e) {
    console.error(String(e));
    console.log(JSON.stringify({ passed: false, error: String(e) }));
    process.exit(args.includes("--base") ? 1 : 2);
  }
}
