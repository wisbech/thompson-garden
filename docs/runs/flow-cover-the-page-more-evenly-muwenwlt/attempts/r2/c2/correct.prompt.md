# role: correct

You are the corrector on card flow-cover-the-page-more-evenly-muwenwlt: flow: cover the page more evenly. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
flow: cover the page more evenly

## Acceptance
- problems/flow/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flow --base <base>)
- only problems/flow/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
CRITERIA:
- 1: uncertain. The diff swaps random starts for Jobard-Lefer seeding beside existing trails, which should raise coverage evenness. I was told not to run anything, so I can't confirm it beats the base on the three worlds. The diff also doesn't show `FlowWorld`, so I can't confirm that `world.trails`, `world.nearest` and `world.spacing` exist with the shapes the code assumes.
- 2: uncertain. Only `problems/flow/agent.ts` changes, and the import is type-only, so the path rule holds. I can't see `judge/check.ts`, so I can't tell whether its source rules ban anything the new code uses. The new code uses `WeakMap`, module-level state, `Math.atan2` and unbounded `for(;;)` loops. The base used none of these.

PROBLEMS:
1. problems/flow/agent.ts: `world.trails`, `world.nearest(x, y)` and `world.spacing` aren't used by the base agent, and nothing in the diff shows they exist. If a trail is not an array of `[x, y]` points, `t[i]`, `p[0]` and `q[1]` break at run time. Check against `judge/flow/world.ts` before accepting.
2. problems/flow/agent.ts: the `for(;;)` loop ends only when `w.done >= world.trails.length`. Every returned seed can add a trail, so this should end in practice, but each call can scan many candidates. Each candidate costs a `world.nearest` call. If `nearest` is linear in the number of trails, a time budget in the judge could be exceeded. The diff has no cap on work per call.
3. problems/flow/agent.ts: the module-level `WeakMap` keeps state between calls. If the check reuses one world object across runs or resets a world in place, `done` and `head` go stale and the agent skips trails. The comment's claim that each run starts clean depends on how the judge builds worlds, and the diff doesn't show that.
4. problems/flow/agent.ts: `i += 2` samples every second trail point. Seeds are therefore spaced by twice the integration step along the trail. This is fine only if the step is much smaller than `spacing`. The code doesn't tie the sampling stride to `spacing`. If steps are large, gaps are left that random fallback has to fill. This is a quality risk, not a proven bug.

I'm not ending with LGTM, because criteria 1 and 2 are uncertain.

## Current diff
```diff
diff --git a/problems/flow/agent.ts b/problems/flow/agent.ts
index 5e6e493..dfafa24 100644
--- a/problems/flow/agent.ts
+++ b/problems/flow/agent.ts
@@ -2,8 +2,31 @@
 // It must stay self-contained (type imports only), because the check also loads the base's copy alone.
 import type { FlowWorld, Point } from "../../judge/flow/world";
 
-// Baseline: start anywhere at random; stop after 400 misses in a row.
+// Start each new trail one spacing beside an existing one (Jobard-Lefer seeding), taking
+// trails in the order they were made so coverage grows outward; when no such place is left, fall back
+// to random starts. State is kept per world, so each run starts clean.
+interface Walk { queue: Point[]; head: number; done: number }
+const walks = new WeakMap<FlowWorld, Walk>();
+
 export function nextSeed(world: FlowWorld): Point | null {
+  let w = walks.get(world);
+  if (!w) walks.set(world, w = { queue: [], head: 0, done: 0 });
+  const d = world.spacing * 1.001;
+  const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < world.width && y < world.height && world.nearest(x, y) >= world.spacing;
+  for (;;) {
+    while (w.head < w.queue.length) {
+      const [x, y] = w.queue[w.head++];
+      if (ok(x, y)) return [x, y];
+    }
+    if (w.done >= world.trails.length) break;
+    w.queue = []; w.head = 0;
+    const t = world.trails[w.done++];
+    for (let i = 0; i < t.length; i += 2) {
+      const p = t[i], q = t[Math.min(i + 1, t.length - 1)], r = t[Math.max(i - 1, 0)];
+      const a = Math.atan2(q[1] - r[1], q[0] - r[0]) + Math.PI / 2;
+      w.queue.push([p[0] + d * Math.cos(a), p[1] + d * Math.sin(a)], [p[0] - d * Math.cos(a), p[1] - d * Math.sin(a)]);
+    }
+  }
   if (world.missesInARow >= 400) return null;
   return [world.random() * world.width, world.random() * world.height];
 }
```
