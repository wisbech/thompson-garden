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
- 1: uncertain — The diff only replaces spring forces with a planned layout. It shows no score and no run of `bun judge/check.ts web --base <base>`. The result also depends on whether the plan runs within the judge's limits, which are problems 1 and 2.
- 2: uncertain — Only `problems/web/agent.ts` changes, so the path rule holds. The source rules are not visible, and the diff uses `performance.now()` and a wall-clock loop, which a determinism or banned-API rule may reject (problem 1).

PROBLEMS:
1. problems/web/agent.ts (`plan`, the local-search loop): `prog = Math.max(it / IT, (performance.now() - t0) / 2500)` makes the result depend on wall-clock time. Layouts differ between runs and machines, and "three worlds seeded from the commit" is no longer reproducible. Source rules in `judge/check.ts` often ban `performance`/`Date`, so this may fail the check outright. It also does up to 2.5 s of work inside the step-0 `forces` call, which can break a per-step time budget. Drop the timer and use a fixed iteration count with `ctx.random` only.
2. problems/web/agent.ts (`forces`): the per-step displacement is capped at an assumed 8 px, and the code returns it as `f` instead of a velocity. The diff does not show the world's speed limit or whether `forces` output is a force, a velocity or a displacement. The baseline returned a damped velocity `v`, so this may exceed the limit and get clamped or rejected. Match the judge's limit from `judge/web/world` rather than hard-coding 8.
3. problems/web/agent.ts (`plan`): the plan ignores the real starting positions `p` and starts from fresh random points. Every node then has to travel from its true start to the target at a capped speed. If the judge's step budget is short, the graph may still be mid-transit and tangled at scoring time. The diff shows no check that the nodes arrive.
4. problems/web/agent.ts (`plan`): the objective is tuned to the agent's own guess at the score: crossing weight 1000, overlap radius 40, rest length 70, margin 20. The diff does not show that these match the judge's measure, so improving the private objective may not raise the score. Edge-length deviation is also optimized against a rest length of 70, which may differ from the judge's preference.
5. problems/web/agent.ts (`local`): each call is O(deg · E) for crossings, called twice per iteration over 30000 iterations. That is slow for large graphs, and since it is combined with the timer (problem 1) the quality becomes machine-dependent.
6. problems/web/agent.ts: the `for (let i = 0; i < n; i++) { ` line has trailing whitespace. This is cosmetic. The header comment about M_6_1_03 was also deleted without any change to the intent, which is minor.

## Current diff
```diff
diff --git a/problems/web/agent.ts b/problems/web/agent.ts
index b130ebe..5c40fef 100644
--- a/problems/web/agent.ts
+++ b/problems/web/agent.ts
@@ -2,20 +2,72 @@
 // Self-contained: type imports only.
 import type { WebAgent } from "../../judge/web/world";
 
-// Baseline, after M_6_1_03: every node repels every other within 100 px, every edge is a spring of
-// rest length 60, velocities damped by half each step.
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
+  }
+  const inc: number[][] = Array.from({ length: n }, () => []);
+  edges.forEach(([a, b], k) => { inc[a].push(k); inc[b].push(k); });
+  const local = (v: number) => {
+    let c = 0;
+    for (const k of inc[v]) { const [a, b] = edges[k]; for (let q = 0; q < edges.length; q++) if (q !== k) c += cross(p, a, b, edges[q][0], edges[q][1]); }
+    let o = 0;
+    for (let j = 0; j < n; j++) if (j !== v && Math.hypot(p[2 * v] - p[2 * j], p[2 * v + 1] - p[2 * j + 1]) < 40) o++;
+    let len = 0;
+    for (const k of inc[v]) { const [a, b] = edges[k]; len += Math.abs(Math.hypot(p[2 * a] - p[2 * b], p[2 * a + 1] - p[2 * b + 1]) - rest); }
+    return c * 1000 + o * 30 + len * 0.1;
+  };
+  const IT = 30000, t0 = performance.now();
+  for (let it = 0; it < IT; it++) {
+    const prog = Math.max(it / IT, (performance.now() - t0) / 2500);
+    if (prog >= 1) break;
+    const v = Math.floor(rnd() * n), ox = p[2 * v], oy = p[2 * v + 1], before = local(v), sc = 80 * (1 - prog) + 3, temp = 800 * (1 - prog) ** 2;
+    if (rnd() < 0.5 && inc[v].length) {
+      let cx = 0, cy = 0;
+      for (const k of inc[v]) { const o = edges[k][0] === v ? edges[k][1] : edges[k][0]; cx += p[2 * o]; cy += p[2 * o + 1]; }
+      p[2 * v] = cx / inc[v].length + (rnd() - 0.5) * sc * 2; p[2 * v + 1] = cy / inc[v].length + (rnd() - 0.5) * sc * 2;
+    } else { p[2 * v] = ox + (rnd() - 0.5) * sc * 2; p[2 * v + 1] = oy + (rnd() - 0.5) * sc * 2; }
+    p[2 * v] = Math.min(W - m, Math.max(m, p[2 * v])); p[2 * v + 1] = Math.min(H - m, Math.max(m, p[2 * v + 1]));
+    if (local(v) - before > -temp * Math.log(1 - rnd())) { p[2 * v] = ox; p[2 * v + 1] = oy; }
+  }
+  return p;
+}
+
 export const forces: WebAgent["forces"] = (p, ctx) => {
-  const n = ctx.n, v = (ctx.memory.v ??= new Float64Array(2 * n)) as Float64Array;
+  const n = ctx.n, mem = ctx.memory;
+  const target = (mem.t ??= plan(n, ctx.edges, ctx.width, ctx.height, ctx.random)) as Float64Array;
   const f = new Float64Array(2 * n);
-  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
-    if (i === j) continue;
-    const dx = p[2 * i] - p[2 * j], dy = p[2 * i + 1] - p[2 * j + 1], d = Math.hypot(dx, dy) || 0.01;
-    if (d < 100) { const s = (100 - d) / 100 * 2; f[2 * i] += dx / d * s; f[2 * i + 1] += dy / d * s; }
-  }
-  for (const [a, b] of ctx.edges) {
-    const dx = p[2 * b] - p[2 * a], dy = p[2 * b + 1] - p[2 * a + 1], d = Math.hypot(dx, dy) || 0.01, s = (d - 60) * 0.05;
-    f[2 * a] += dx / d * s; f[2 * a + 1] += dy / d * s; f[2 * b] -= dx / d * s; f[2 * b + 1] -= dy / d * s;
+  for (let i = 0; i < n; i++) { 
+    const dx = target[2 * i] - p[2 * i], dy = target[2 * i + 1] - p[2 * i + 1], l = Math.hypot(dx, dy), k = l > 8 ? 8 / l : 1;
+    f[2 * i] = dx * k; f[2 * i + 1] = dy * k;
   }
-  for (let k = 0; k < 2 * n; k++) { v[k] = (v[k] + f[k]) * 0.5; }
-  return v;
+  return f;
 };
```
