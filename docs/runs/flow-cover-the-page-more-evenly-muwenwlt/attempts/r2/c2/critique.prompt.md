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
