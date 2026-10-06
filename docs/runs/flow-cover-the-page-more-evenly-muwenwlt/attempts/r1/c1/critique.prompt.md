# role: critique

You are the critic on card flow-cover-the-page-more-evenly-muwenwlt: flow: cover the page more evenly. Read the diff below against the task and the acceptance criteria.
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
flow: cover the page more evenly

## Acceptance
- problems/flow/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flow --base <base>)
- only problems/flow/ changes; the agent keeps to the source rules in judge/check.ts

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
diff --git a/problems/flow/agent.ts b/problems/flow/agent.ts
index 5e6e493..906a440 100644
--- a/problems/flow/agent.ts
+++ b/problems/flow/agent.ts
@@ -2,8 +2,33 @@
 // It must stay self-contained (type imports only), because the check also loads the base's copy alone.
 import type { FlowWorld, Point } from "../../judge/flow/world";
 
-// Baseline: start anywhere at random; stop after 400 misses in a row.
+// Seeds just beside existing trails (Jobard-Lefer): walk each accepted trail in order and offer a start
+// a little over one spacing to either side, which the judge accepts and which packs trails tightly.
+// When no trail has room left, fall back to random starts that are already known to be clear.
+interface State { trail: number; point: number; side: number }
+const states = new WeakMap<FlowWorld, State>();
+
 export function nextSeed(world: FlowWorld): Point | null {
-  if (world.missesInARow >= 400) return null;
+  let s = states.get(world);
+  if (!s) states.set(world, (s = { trail: 0, point: 0, side: 0 }));
+  const d = world.spacing * 1.0005, stride = 2;
+  while (s.trail < world.trails.length) {
+    const t = world.trails[s.trail];
+    while (s.point < t.length) {
+      const i = s.point, p = t[i], q = t[Math.min(i + 1, t.length - 1)], r = t[Math.max(i - 1, 0)];
+      const a = Math.atan2(q[1] - r[1], q[0] - r[0]) + (s.side ? -Math.PI / 2 : Math.PI / 2);
+      if (++s.side > 1) { s.side = 0; s.point += stride; }
+      const x = p[0] + d * Math.cos(a), y = p[1] + d * Math.sin(a);
+      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
+      if (world.nearest(x, y) < world.spacing) continue;
+      return [x, y];
+    }
+    s.trail++; s.point = 0; s.side = 0;
+  }
+  if (world.missesInARow >= 20000) return null;
+  for (let k = 0; k < 300; k++) {
+    const x = world.random() * world.width, y = world.random() * world.height;
+    if (world.nearest(x, y) >= world.spacing) return [x, y];
+  }
   return [world.random() * world.width, world.random() * world.height];
 }
```
