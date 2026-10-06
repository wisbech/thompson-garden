# role: correct

You are the corrector on card web-untangle-the-graph-with-springs-muweo029: web: untangle the graph with springs. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
web: untangle the graph with springs

## Acceptance
- problems/web/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts web --base <base>)
- only problems/web/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
CRITERIA:
- 1: uncertain — The diff has no score output and I did not run `judge/check.ts`, so a gain over base is unproven. Several risks are listed below.
- 2: uncertain — Only `problems/web/agent.ts` changes and its sole import is a type import, so the path rule passes. I can't see `judge/check.ts`, so I can't confirm the source rules are met. The agent uses `Float64Array`, casts `ctx.memory`, and uses `findIndex` and `reduce`.

PROBLEMS:
1. problems/web/agent.ts: The schedule hard-codes `ENDS = [300, 450, 540]`, and the walk-back to the best layout only runs at `ctx.step >= 540`. If the judge runs fewer than 540 steps, the final cycle is cut off mid-cooling. The restore never fires, so the agent ends on a hot, unconverged layout. The agent should read the horizon from `ctx` if the judge exposes it. If not, it should restore the best layout earlier.
2. problems/web/agent.ts: The return value changes meaning. The base returned a damped velocity accumulated in `memory.v`. The new code returns a per-step displacement clamped to `t`, and at the end returns `best - p`, a full jump. If the judge integrates the return as a velocity, applies its own damping, or caps the move, the temperature schedule and the restore step behave differently from what the comments claim. Nothing in the diff shows this was checked.
3. problems/web/agent.ts: The natural length is `k = sqrt(area/n) * 0.2`. For typical sizes this is only about 15–25 px, and equilibrium is at d≈k. That is the same size as the 16 px overlap threshold the agent penalizes itself for. The layout will be crushed, with nodes overlapping and crossings unlikely to untangle well. The `0.2` is an unexplained magic factor and probably should be about 1 or a value tuned against the judge.
4. problems/web/agent.ts: Nothing keeps nodes inside `width`/`height`. `ctx.width - 20` suggests a margin, but positions are never clamped. If the judge scores out-of-bounds nodes or clips them, the repulsion can push nodes out and the agent gets penalized.
5. problems/web/agent.ts: `quality()` is the agent's own proxy (`1/(1+cr) + 0.1*evenness - 0.02*ov`), not the judge's score. The 16 px overlap radius, the `0.1` and `0.02` weights, and the crossing-dominant form are guesses. "Best" may not be what the judge rewards. The edge-length term also rewards uniform lengths regardless of the judge's measure.
6. problems/web/agent.ts: `quality()` is O(E²) crossing tests plus O(n²) overlap tests on every step, for 540 steps, run for each of three worlds. If the judge has a time budget or large graphs, this could time out. The diff has no evidence it fits.

## Current diff
```diff
diff --git a/problems/web/agent.ts b/problems/web/agent.ts
index b130ebe..9effb04 100644
--- a/problems/web/agent.ts
+++ b/problems/web/agent.ts
@@ -1,21 +1,54 @@
-// The Web agent: the forces that move each node. The only file a Web card changes.
+// The Web agent: your code. The judge owns the world and calls forces() every step.
 // Self-contained: type imports only.
 import type { WebAgent } from "../../judge/web/world";
 
-// Baseline, after M_6_1_03: every node repels every other within 100 px, every edge is a spring of
-// rest length 60, velocities damped by half each step.
+// Fruchterman-Reingold with cooling, run as a few reheated cycles. The agent scores its own layout
+// every step (crossings, evenness, overlaps), remembers the best, and walks back to it at the end.
+const ENDS = [300, 450, 540], HOT = [6, 6, 6];
+
+const orient = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
+
+function quality(p: Float64Array, edges: readonly (readonly [number, number])[], n: number): number {
+  let cr = 0;
+  for (let a = 0; a < edges.length; a++) for (let b = a + 1; b < edges.length; b++) {
+    const [P, Q] = edges[a], [S, T] = edges[b];
+    if (P === S || P === T || Q === S || Q === T) continue;
+    const d1 = orient(p[2 * S], p[2 * S + 1], p[2 * T], p[2 * T + 1], p[2 * P], p[2 * P + 1]), d2 = orient(p[2 * S], p[2 * S + 1], p[2 * T], p[2 * T + 1], p[2 * Q], p[2 * Q + 1]);
+    const d3 = orient(p[2 * P], p[2 * P + 1], p[2 * Q], p[2 * Q + 1], p[2 * S], p[2 * S + 1]), d4 = orient(p[2 * P], p[2 * P + 1], p[2 * Q], p[2 * Q + 1], p[2 * T], p[2 * T + 1]);
+    if (((d1 > 1e-9 && d2 < -1e-9) || (d1 < -1e-9 && d2 > 1e-9)) && ((d3 > 1e-9 && d4 < -1e-9) || (d3 < -1e-9 && d4 > 1e-9))) cr++;
+  }
+  let ov = 0;
+  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(p[2 * i] - p[2 * j], p[2 * i + 1] - p[2 * j + 1]) < 16) ov++;
+  const lens = edges.map(([a, b]) => Math.hypot(p[2 * a] - p[2 * b], p[2 * a + 1] - p[2 * b + 1]));
+  const mean = lens.reduce((x, y) => x + y, 0) / lens.length;
+  const sd = Math.sqrt(lens.reduce((x, y) => x + (y - mean) ** 2, 0) / lens.length);
+  return 1 / (1 + cr) + 0.1 * (mean > 0 ? Math.max(0, 1 - sd / mean) : 0) - 0.02 * ov;
+}
+
 export const forces: WebAgent["forces"] = (p, ctx) => {
-  const n = ctx.n, v = (ctx.memory.v ??= new Float64Array(2 * n)) as Float64Array;
+  const n = ctx.n, out = new Float64Array(2 * n), mem = ctx.memory as { best?: Float64Array; q?: number };
+  const q = quality(p, ctx.edges, n);
+  if (mem.q === undefined || q > mem.q) { mem.q = q; mem.best = Float64Array.from(p); }
+  const last = ENDS[ENDS.length - 1];
+  if (ctx.step >= last && mem.best) {
+    for (let k = 0; k < 2 * n; k++) out[k] = mem.best[k] - p[k];
+    return out;
+  }
   const f = new Float64Array(2 * n);
-  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
-    if (i === j) continue;
+  const k = Math.sqrt((ctx.width - 20) * (ctx.height - 20) / n) * 0.2;
+  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
     const dx = p[2 * i] - p[2 * j], dy = p[2 * i + 1] - p[2 * j + 1], d = Math.hypot(dx, dy) || 0.01;
-    if (d < 100) { const s = (100 - d) / 100 * 2; f[2 * i] += dx / d * s; f[2 * i + 1] += dy / d * s; }
+    const s = k * k / d / d;
+    f[2 * i] += dx * s; f[2 * i + 1] += dy * s; f[2 * j] -= dx * s; f[2 * j + 1] -= dy * s;
   }
   for (const [a, b] of ctx.edges) {
-    const dx = p[2 * b] - p[2 * a], dy = p[2 * b + 1] - p[2 * a + 1], d = Math.hypot(dx, dy) || 0.01, s = (d - 60) * 0.05;
-    f[2 * a] += dx / d * s; f[2 * a + 1] += dy / d * s; f[2 * b] -= dx / d * s; f[2 * b + 1] -= dy / d * s;
+    const dx = p[2 * b] - p[2 * a], dy = p[2 * b + 1] - p[2 * a + 1], d = Math.hypot(dx, dy) || 0.01, s = d / k;
+    f[2 * a] += dx * s; f[2 * a + 1] += dy * s; f[2 * b] -= dx * s; f[2 * b + 1] -= dy * s;
+  }
+  const c = ENDS.findIndex((e) => ctx.step < e), s0 = c ? ENDS[c - 1] : 0, frac = (ctx.step - s0) / (ENDS[c] - s0), t = HOT[c] * (1 - frac) ** 2 + 0.1;
+  for (let i = 0; i < n; i++) {
+    const len = Math.hypot(f[2 * i], f[2 * i + 1]) || 1, m = Math.min(len, t) / len;
+    out[2 * i] = f[2 * i] * m; out[2 * i + 1] = f[2 * i + 1] * m;
   }
-  for (let k = 0; k < 2 * n; k++) { v[k] = (v[k] + f[k]) * 0.5; }
-  return v;
+  return out;
 };
```
