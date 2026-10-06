# role: critique

You are the critic on card web-untangle-the-graph-with-springs-muweo029: web: untangle the graph with springs. Read the diff below against the task and the acceptance criteria.
Assume every change is wrong until the diff itself justifies it; the burden of proof is on the diff, not on you.

Name concrete errors only: wrong logic, a missing case, a criterion the diff does not meet, an edit to a
protected path, a change the task did not ask for. Do not edit any file and do not run anything.

Reply in this form, one line per acceptance criterion, in their order:

CRITERIA:
- 1: pass|fail|uncertain — the evidence in the diff, in one line
- 2: ...
PROBLEMS:
1. <file>: <what is wrong and what to change>
2. ...

If every criterion passes and you find no problem, end your reply with a line that is exactly: LGTM

## Task
web: untangle the graph with springs

## Acceptance
- problems/web/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts web --base <base>)
- only problems/web/ changes; the agent keeps to the source rules in judge/check.ts

## Protected paths
checks/
src/kernel/
KERNEL.md
CODEOWNERS
thompson.json
package.json
bunfig.toml
bun.lock
bun.lockb
package-lock.json
yarn.lock
pnpm-lock.yaml
judge/
site/
docs/
tsconfig.json
README.md

Mechanism paths (this is an ordinary card; a rollout that touches them is refused by the host before the judge):
adapters/
src/

## Diff
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
