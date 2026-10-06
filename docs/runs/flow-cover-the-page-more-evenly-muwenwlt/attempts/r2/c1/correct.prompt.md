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
- 1: uncertain. The diff has no scores. Jobard-Lefer-style seeding plausibly beats random starts, but nothing here shows it beats the base on all three seeded worlds. The raised random-miss cutoff (400 → 6000) is untested against any step or time budget.
- 2: uncertain. Only `problems/flow/agent.ts` changes, so the protected and mechanism paths are untouched. The agent now keeps module-level mutable state (`queue`, `head`, `done`, `lastCalls`). I can't see `judge/check.ts` from the diff, so I can't confirm this is allowed. The check also loads the base's copy on its own, which makes hidden state risky.

PROBLEMS:
1. problems/flow/agent.ts: The reset detection `world.calls <= lastCalls` is a fragile way to tell worlds apart. It assumes `calls` strictly increases between consecutive `nextSeed` calls. If `calls` doesn't advance when a seed is rejected, or the check calls `nextSeed` twice in a row, the queue is wiped and `done` goes back to 0. The agent then re-walks trails from the start and rescans them repeatedly. It also assumes a new world's `calls` is lower than the previous world's final count. Derive the state from the world itself instead, for example by keying on the `world` object (a WeakMap) or on `world.trails`. That also keeps the agent free of globals.
2. problems/flow/agent.ts: It relies on `world.trails`, `world.nearest`, `world.calls` and `world.spacing`. The diff doesn't show that these exist on `FlowWorld` or that the source rules allow using them. Confirm each against `judge/flow/world.ts` and `judge/check.ts`.
3. problems/flow/agent.ts: The random fallback cutoff of 6000 consecutive misses is a large, unexplained jump from 400. It could run past a time or call limit and make the check fail or time out. Justify the number, or lower it.
4. problems/flow/agent.ts: Queue candidates are built from every second trail point, but the walk only moves on to the next trail once the current queue is exhausted. Coverage therefore grows trail by trail, not evenly outward. Each candidate is also checked with a tight `d - 0.02` tolerance, which may reject valid seeds near the page edges and push the work onto the random fallback.

## Current diff
```diff
diff --git a/problems/flow/agent.ts b/problems/flow/agent.ts
index 5e6e493..9a4d78e 100644
--- a/problems/flow/agent.ts
+++ b/problems/flow/agent.ts
@@ -2,8 +2,32 @@
 // It must stay self-contained (type imports only), because the check also loads the base's copy alone.
 import type { FlowWorld, Point } from "../../judge/flow/world";
 
-// Baseline: start anywhere at random; stop after 400 misses in a row.
+// Start each new trail just over one spacing beside an existing one (Jobard-Lefer seeding), working
+// outward from the first trail; when no such place is left, fall back to random starts.
+let queue: Point[] = [];
+let head = 0;
+let done = 0;
+let lastCalls = Infinity;
+
 export function nextSeed(world: FlowWorld): Point | null {
-  if (world.missesInARow >= 400) return null;
+  if (world.calls <= lastCalls) { queue = []; head = 0; done = 0; }
+  lastCalls = world.calls;
+  const d = world.spacing * 1.01;
+  const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < world.width && y < world.height && world.nearest(x, y) >= d - 0.02;
+  for (;;) {
+    while (head < queue.length) {
+      const [x, y] = queue[head++];
+      if (ok(x, y)) return [x, y];
+    }
+    if (done >= world.trails.length) break;
+    queue = []; head = 0;
+    const t = world.trails[done++];
+    for (let i = 0; i < t.length; i += 2) {
+      const p = t[i], q = t[Math.min(i + 1, t.length - 1)], r = t[Math.max(i - 1, 0)];
+      const a = Math.atan2(q[1] - r[1], q[0] - r[0]) + Math.PI / 2;
+      queue.push([p[0] + d * Math.cos(a), p[1] + d * Math.sin(a)], [p[0] - d * Math.cos(a), p[1] - d * Math.sin(a)]);
+    }
+  }
+  if (world.missesInARow >= 6000) return null;
   return [world.random() * world.width, world.random() * world.height];
 }
```
