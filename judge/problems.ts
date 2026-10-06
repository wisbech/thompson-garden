// Every problem the judge knows: where its agent lives and how one seeded run is scored and drawn.
import * as flow from "./flow/world";
import * as slime from "./slime/world";
import { picture as slimePicture } from "./slime/picture";
import * as web from "./web/world";
import * as flock from "./flock/world";
import * as canopy from "./canopy/world";
import * as ltree from "./ltree/world";

export interface Outcome { score: number; detail: Record<string, unknown>; picture(): { ext: "svg" | "png"; data: string | Buffer } }
export interface Problem { agent: string; run(mod: any, seed: number, budgetMs: number): Outcome }

export const BUDGET_MS = 10_000;
export const FIXED_SEEDS = [1, 2, 3];

export const problems: Record<string, Problem> = {
  flow: {
    agent: "problems/flow/agent.ts",
    run: (mod, seed, ms) => {
      const r = flow.run(mod, seed, ms);
      return { score: r.coverage, detail: { trails: r.trails.length, calls: r.calls, cut: r.cut }, picture: () => ({ ext: "svg", data: flow.toSvg(r.trails) }) };
    },
  },
  slime: {
    agent: "problems/slime/agent.ts",
    run: (mod, seed, ms) => {
      const r = slime.run(mod, seed, ms);
      return { score: r.score, detail: { connected: r.connected, pairsJoined: r.pairs, cells: r.cells, mst: r.mst }, picture: () => ({ ext: "png", data: slimePicture(r) }) };
    },
  },
  web: {
    agent: "problems/web/agent.ts",
    run: (mod, seed, ms) => {
      const r = web.run(mod, seed, ms);
      return { score: r.score, detail: { crossings: r.crossings, overlaps: r.overlaps, evenness: r.evenness }, picture: () => ({ ext: "svg", data: web.picture(r) }) };
    },
  },
  flock: {
    agent: "problems/flock/agent.ts",
    run: (mod, seed, ms) => {
      const r = flock.run(mod, seed, ms);
      return { score: r.score, detail: { arrived: r.arrived, died: r.died, collisions: r.collisions }, picture: () => ({ ext: "svg", data: flock.picture(r) }) };
    },
  },
  canopy: {
    agent: "problems/canopy/agent.ts",
    run: (mod, seed, ms) => {
      const r = canopy.run(mod, seed, ms);
      return { score: r.score, detail: { valid: r.valid, reason: r.reason, light: r.light, wood: r.wood, leaves: r.leaves }, picture: () => ({ ext: "svg", data: canopy.picture(r) }) };
    },
  },
  ltree: {
    agent: "problems/ltree/agent.ts",
    run: (mod, seed, ms) => {
      const r = ltree.run(mod, seed, ms);
      return { score: r.score, detail: { valid: r.valid, reason: r.reason, light: r.light, wood: r.wood, leaves: r.leaves, symbols: r.symbols }, picture: () => ({ ext: "svg", data: ltree.picture(r) }) };
    },
  },
};

export function scoreModule(p: Problem, mod: any, seeds: number[], budgetMs = BUDGET_MS) {
  const runs = seeds.map((seed) => {
    try { const o = p.run(mod, seed, budgetMs); return { seed, score: o.score, ...o.detail }; }
    catch (e) { return { seed, score: -1, error: String(e) }; }
  });
  return { mean: runs.reduce((a, r) => a + r.score, 0) / runs.length, runs };
}
