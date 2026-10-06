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
- 1: uncertain. The diff has no score evidence, and I did not run `judge/check.ts`. The layout plan is sound in principle: spring relaxation, then annealing on crossings, overlap and edge length. Three things could stop it beating the base. They are listed under PROBLEMS.
- 2: uncertain. Only `problems/web/agent.ts` changes, so the path rule passes. I cannot see `judge/check.ts` from the diff, so I cannot confirm the source rules. The agent has type-only imports, no `Math.random` (it uses `ctx.random`) and no I/O. Whether `ctx.random`, `ctx.width` and `ctx.height` exist on the context type is unconfirmed.

PROBLEMS:
1. problems/web/agent.ts, `forces` return value: the baseline returned a damped velocity, and the new code returns `target - p`. This is the full remaining displacement, with no clamp to the allowed speed. The header comment says nodes "walk … at the allowed speed". If the world does not clamp per-step movement, nodes jump straight to the plan. If it clamps by magnitude, it works, but only because of that assumption. Clamp the step explicitly, or confirm the world's contract in `judge/web/world`.
2. problems/web/agent.ts, `plan`: the plan uses 200,000 annealing iterations. Each iteration calls `local()` twice. `local()` scans every edge for each incident edge, plus all nodes, so each call is O(deg·E + n). It runs inside step 0 of `forces` and once per world. If the judge has a per-step or per-run time budget, or runs many worlds, this may time out or fail the run. Reduce the iteration count, or evaluate the crossing delta incrementally.
3. problems/web/agent.ts, `plan`: the plan ignores the initial positions `p` and draws fresh random positions from `ctx.random`. This consumes the world's RNG stream, which may change what the judge's worlds do. Margin `m = 20` and rest length `70` are hard-coded and not read from the world. If the world scores edge length against a different rest length, or has a different boundary margin, the optimized objective will not match the score. Confirm they match the judge's metric.
4. problems/web/agent.ts, `plan`: all nodes move simultaneously in straight lines toward their targets. If the score counts crossings or overlap during the run rather than only at the final frame, the transit will be penalized. The diff gives no evidence either way.

## Current diff
```diff
diff --git a/problems/web/agent.ts b/problems/web/agent.ts
index b130ebe..dbc37ba 100644
--- a/problems/web/agent.ts
+++ b/problems/web/agent.ts
@@ -2,20 +2,67 @@
 // Self-contained: type imports only.
 import type { WebAgent } from "../../judge/web/world";
 
-// Baseline, after M_6_1_03: every node repels every other within 100 px, every edge is a spring of
-// rest length 60, velocities damped by half each step.
-export const forces: WebAgent["forces"] = (p, ctx) => {
-  const n = ctx.n, v = (ctx.memory.v ??= new Float64Array(2 * n)) as Float64Array;
-  const f = new Float64Array(2 * n);
-  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
-    if (i === j) continue;
-    const dx = p[2 * i] - p[2 * j], dy = p[2 * i + 1] - p[2 * j + 1], d = Math.hypot(dx, dy) || 0.01;
-    if (d < 100) { const s = (100 - d) / 100 * 2; f[2 * i] += dx / d * s; f[2 * i + 1] += dy / d * s; }
+// Plan once on step 0 (spring relaxation, then crossing-removing local search on a private copy of the
+// graph), then walk every node toward its planned spot at the allowed speed.
+const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
+const cross = (p: Float64Array, a: number, b: number, c: number, d: number) => {
+  if (a === c || a === d || b === c || b === d) return 0;
+  const d1 = ccw(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], p[2 * c], p[2 * c + 1]);
+  const d2 = ccw(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], p[2 * d], p[2 * d + 1]);
+  const d3 = ccw(p[2 * c], p[2 * c + 1], p[2 * d], p[2 * d + 1], p[2 * a], p[2 * a + 1]);
+  const d4 = ccw(p[2 * c], p[2 * c + 1], p[2 * d], p[2 * d + 1], p[2 * b], p[2 * b + 1]);
+  return d1 * d2 < 0 && d3 * d4 < 0 ? 1 : 0;
+};
+
+function plan(n: number, edges: readonly (readonly [number, number])[], W: number, H: number, rnd: () => number) {
+  const m = 20, p = new Float64Array(2 * n);
+  for (let i = 0; i < n; i++) { p[2 * i] = m + rnd() * (W - 2 * m); p[2 * i + 1] = m + rnd() * (H - 2 * m); }
+  const rest = 70;
+  for (let it = 0; it < 500; it++) {
+    const f = new Float64Array(2 * n), cool = 1 - it / 500;
+    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
+      const dx = p[2 * i] - p[2 * j], dy = p[2 * i + 1] - p[2 * j + 1], d2 = dx * dx + dy * dy + 0.01, s = 3000 / d2;
+      f[2 * i] += dx * s; f[2 * i + 1] += dy * s; f[2 * j] -= dx * s; f[2 * j + 1] -= dy * s;
+    }
+    for (const [a, b] of edges) {
+      const dx = p[2 * b] - p[2 * a], dy = p[2 * b + 1] - p[2 * a + 1], d = Math.hypot(dx, dy) || 0.01, s = (d - rest) * 0.15 / d;
+      f[2 * a] += dx * s; f[2 * a + 1] += dy * s; f[2 * b] -= dx * s; f[2 * b + 1] -= dy * s;
+    }
+    for (let i = 0; i < n; i++) {
+      const fx = f[2 * i], fy = f[2 * i + 1], l = Math.hypot(fx, fy) || 1, cap = Math.min(l, 10 * cool + 0.5);
+      p[2 * i] = Math.min(W - m, Math.max(m, p[2 * i] + fx / l * cap));
+      p[2 * i + 1] = Math.min(H - m, Math.max(m, p[2 * i + 1] + fy / l * cap));
+    }
   }
-  for (const [a, b] of ctx.edges) {
-    const dx = p[2 * b] - p[2 * a], dy = p[2 * b + 1] - p[2 * a + 1], d = Math.hypot(dx, dy) || 0.01, s = (d - 60) * 0.05;
-    f[2 * a] += dx / d * s; f[2 * a + 1] += dy / d * s; f[2 * b] -= dx / d * s; f[2 * b + 1] -= dy / d * s;
+  const inc: number[][] = Array.from({ length: n }, () => []);
+  edges.forEach(([a, b], k) => { inc[a].push(k); inc[b].push(k); });
+  const local = (v: number) => {
+    let c = 0;
+    for (const k of inc[v]) { const [a, b] = edges[k]; for (let q = 0; q < edges.length; q++) if (q !== k && !(inc[v].includes(q) && q < k)) c += cross(p, a, b, edges[q][0], edges[q][1]); }
+    let o = 0;
+    for (let j = 0; j < n; j++) if (j !== v && Math.hypot(p[2 * v] - p[2 * j], p[2 * v + 1] - p[2 * j + 1]) < 40) o++;
+    let len = 0;
+    for (const k of inc[v]) { const [a, b] = edges[k]; len += Math.abs(Math.hypot(p[2 * a] - p[2 * b], p[2 * a + 1] - p[2 * b + 1]) - rest); }
+    return c * 1000 + o * 30 + len * 0.1;
+  };
+  const IT = 200000;
+  for (let it = 0; it < IT; it++) {
+    const v = Math.floor(rnd() * n), ox = p[2 * v], oy = p[2 * v + 1], before = local(v), sc = 80 * (1 - it / IT) + 3, temp = 800 * (1 - it / IT) ** 2;
+    if (rnd() < 0.5 && inc[v].length) {
+      let cx = 0, cy = 0;
+      for (const k of inc[v]) { const o = edges[k][0] === v ? edges[k][1] : edges[k][0]; cx += p[2 * o]; cy += p[2 * o + 1]; }
+      p[2 * v] = cx / inc[v].length + (rnd() - 0.5) * sc * 2; p[2 * v + 1] = cy / inc[v].length + (rnd() - 0.5) * sc * 2;
+    } else { p[2 * v] = ox + (rnd() - 0.5) * sc * 2; p[2 * v + 1] = oy + (rnd() - 0.5) * sc * 2; }
+    p[2 * v] = Math.min(W - m, Math.max(m, p[2 * v])); p[2 * v + 1] = Math.min(H - m, Math.max(m, p[2 * v + 1]));
+    if (local(v) - before > -temp * Math.log(1 - rnd())) { p[2 * v] = ox; p[2 * v + 1] = oy; }
   }
-  for (let k = 0; k < 2 * n; k++) { v[k] = (v[k] + f[k]) * 0.5; }
-  return v;
+  return p;
+}
+
+export const forces: WebAgent["forces"] = (p, ctx) => {
+  const n = ctx.n, mem = ctx.memory;
+  const target = (mem.t ??= plan(n, ctx.edges, ctx.width, ctx.height, ctx.random)) as Float64Array;
+  const f = new Float64Array(2 * n);
+  for (let i = 0; i < n; i++) { f[2 * i] = target[2 * i] - p[2 * i]; f[2 * i + 1] = target[2 * i + 1] - p[2 * i + 1]; }
+  return f;
 };
```
