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
- 1: uncertain. The diff has no score or output from `bun judge/check.ts web --base <base>`, and nothing in it shows an improvement over the baseline. The new code also depends on `ctx.step`, `ctx.width` and `ctx.height`. The baseline only used `ctx.n`, `ctx.edges` and `ctx.memory`, so I can't tell from the diff that these fields exist.
- 2: uncertain. Only `problems/web/agent.ts` changes, so the path rule passes. I can't confirm the source rules in `judge/check.ts`. The new module-level `const K_SCALE` placed after the function could break a rule such as no top-level state or constants.

PROBLEMS:
1. problems/web/agent.ts: `ctx.step`, `ctx.width` and `ctx.height` are assumed to be on the context, and a 600-step run length is hard-coded into the schedule (150 steps after step 450). If `ctx.step` is undefined, every `ctx.step < …` test is false and `t` becomes `0.3*(1-NaN)+0.1 = NaN`. `Math.min(len, NaN)` is NaN, so every position turns NaN and the score collapses. Check the `WebAgent` ctx type, and either guard with a default or avoid depending on `step`.
2. problems/web/agent.ts: the cooling schedule is a sawtooth, not a monotone cooling. At step 249 `t ≈ 0.33`, and at step 250 it jumps to `5.3`. It jumps again at step 450, from `5×0.005+0.3 ≈ 0.3` to `0.4`. This reheats the layout twice, which contradicts the header comment ("shrinks over the run so the layout settles"). The intent isn't documented, and the reheats can undo the untangling that was just done. Use one monotone schedule, or explain the restarts.
3. problems/web/agent.ts: the cap `t` is a displacement limit, but the baseline returned a damped velocity. If the world integrates the return value as a velocity with its own step size or damping, the effective step differs from what the cooling constants assume. Nothing shows the constants were tuned against the world's integrator.
4. problems/web/agent.ts: `k` is derived from `(width-20)*(height-20)`, which implies a margin. There is no gravity or clamp to the bounds. Repulsion at `k²/d` has no cutoff, and the cap is only 8 px per step, so nodes can drift out of the frame. If the world doesn't clamp, the score may drop. The diff doesn't show whether it does.
5. problems/web/agent.ts: `const K_SCALE = 0.35` is declared after its use, as an untuned magic number. It works at call time but is fragile. Move it above `forces`, or inline it, and add the tuning evidence.

## Current diff
```diff
diff --git a/problems/web/agent.ts b/problems/web/agent.ts
index b130ebe..372aa84 100644
--- a/problems/web/agent.ts
+++ b/problems/web/agent.ts
@@ -2,20 +2,26 @@
 // Self-contained: type imports only.
 import type { WebAgent } from "../../judge/web/world";
 
-// Baseline, after M_6_1_03: every node repels every other within 100 px, every edge is a spring of
-// rest length 60, velocities damped by half each step.
+// Fruchterman-Reingold with cooling: every pair repels as k^2/d, every edge pulls as d^2/k, and the
+// step each node may take shrinks over the run so the layout settles once it has untangled.
 export const forces: WebAgent["forces"] = (p, ctx) => {
-  const n = ctx.n, v = (ctx.memory.v ??= new Float64Array(2 * n)) as Float64Array;
-  const f = new Float64Array(2 * n);
-  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
-    if (i === j) continue;
+  const n = ctx.n, f = new Float64Array(2 * n);
+  const k = Math.sqrt((ctx.width - 20) * (ctx.height - 20) / n) * K_SCALE;
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
   }
-  for (let k = 0; k < 2 * n; k++) { v[k] = (v[k] + f[k]) * 0.5; }
-  return v;
+  const t = ctx.step < 250 ? 8 * (1 - ctx.step / 250) + 0.3 : ctx.step < 450 ? 5 * (1 - (ctx.step - 250) / 200) + 0.3 : 0.3 * (1 - (ctx.step - 450) / 150) + 0.1;
+  const out = new Float64Array(2 * n);
+  for (let i = 0; i < n; i++) {
+    const len = Math.hypot(f[2 * i], f[2 * i + 1]) || 1, m = Math.min(len, t) / len;
+    out[2 * i] = f[2 * i] * m; out[2 * i + 1] = f[2 * i + 1] * m;
+  }
+  return out;
 };
+const K_SCALE = 0.35;
```
