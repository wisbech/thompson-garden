# role: continue

You are the worker on card flow-cover-the-page-more-evenly-muwenwlt: flow: cover the page more evenly.

The working directory holds your previous attempt; its diff against the base is below. Extend or rewrite it so
that every acceptance criterion holds. Edit files directly. Do not run the project's tests. Never edit a
protected path.

## Task
flow: cover the page more evenly

## Acceptance
- problems/flow/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flow --base <base>)
- only problems/flow/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The flow problem: read problems/flow/README.md and judge/flow/world.ts (the world, protected) first. Change only problems/flow/agent.ts. Baseline 0.8282 on fixed seeds; bun judge/check.ts flow --score prints the current score and bun judge/check.ts flow --picture /tmp/flow draws it.

## Score (higher is better)
The project's own measure, 1.230212 at the base (command: bun judge/check.ts all --score; higher is better). Within the acceptance criteria, the bigger the rise the better; a change
that passes the check by the smallest possible margin is a weak result.

## Protected paths (never edit)
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

## Current diff
```diff
diff --git a/problems/flow/agent.ts b/problems/flow/agent.ts
index 5e6e493..4b764ac 100644
--- a/problems/flow/agent.ts
+++ b/problems/flow/agent.ts
@@ -2,8 +2,38 @@
 // It must stay self-contained (type imports only), because the check also loads the base's copy alone.
 import type { FlowWorld, Point } from "../../judge/flow/world";
 
-// Baseline: start anywhere at random; stop after 400 misses in a row.
+// Seeds just beside existing trails (Jobard-Lefer): walk each accepted trail in order and offer a start
+// a little over one spacing to either side, which the judge accepts and which packs trails tightly.
+// When no trail has room left, fall back to random starts that are already known to be clear.
+interface State { trail: number; point: number; side: number; seen: number }
+const states = new WeakMap<FlowWorld, State>();
+
 export function nextSeed(world: FlowWorld): Point | null {
+  let s = states.get(world);
+  if (!s) states.set(world, (s = { trail: 0, point: 0, side: 0, seen: 0 }));
+  const d = world.spacing * 1.0005, stride = 2;
+  for (;;) {
+    while (s.trail < world.trails.length) {
+      const t = world.trails[s.trail];
+      while (s.point < t.length) {
+        const i = s.point, p = t[i], q = t[Math.min(i + 1, t.length - 1)], r = t[Math.max(i - 1, 0)];
+        const a = Math.atan2(q[1] - r[1], q[0] - r[0]) + (s.side ? -Math.PI / 2 : Math.PI / 2);
+        if (++s.side > 1) { s.side = 0; s.point += stride; }
+        const x = p[0] + d * Math.cos(a), y = p[1] + d * Math.sin(a);
+        if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
+        if (world.nearest(x, y) < world.spacing) continue;
+        return [x, y];
+      }
+      s.trail++; s.point = 0; s.side = 0;
+    }
+    // Pass finished: if trails were added meanwhile, gaps may have opened beside earlier ones, so walk again.
+    if (world.trails.length === s.seen) break;
+    s.seen = world.trails.length; s.trail = 0; s.point = 0; s.side = 0;
+  }
   if (world.missesInARow >= 400) return null;
+  for (let k = 0; k < 10; k++) {
+    const x = world.random() * world.width, y = world.random() * world.height;
+    if (world.nearest(x, y) >= world.spacing) return [x, y];
+  }
   return [world.random() * world.width, world.random() * world.height];
 }
```
