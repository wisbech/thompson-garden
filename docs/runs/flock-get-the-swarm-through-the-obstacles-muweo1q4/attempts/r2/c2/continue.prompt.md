# role: continue

You are the worker on card flock-get-the-swarm-through-the-obstacles-muweo1q4: flock: get the swarm through the obstacles.

The working directory holds your previous attempt; its diff against the base is below. Extend or rewrite it so
that every acceptance criterion holds. Edit files directly. Do not run the project's tests. Never edit a
protected path.

## Task
flock: get the swarm through the obstacles

## Acceptance
- problems/flock/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flock --base <base>)
- only problems/flock/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The flock problem: read problems/flock/README.md and judge/flock/world.ts (the world, protected) first. Change only problems/flock/agent.ts. Baseline 0.0183 on fixed seeds; bun judge/check.ts flock --score prints the current score and bun judge/check.ts flock --picture /tmp/flock draws it.

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
diff --git a/problems/flock/agent.ts b/problems/flock/agent.ts
index bea04d8..5e8a877 100644
--- a/problems/flock/agent.ts
+++ b/problems/flock/agent.ts
@@ -2,5 +2,31 @@
 // Self-contained: type imports only.
 import type { FlockAgent } from "../../judge/flock/world";
 
-// Baseline, the "stupid agent" of P_2_2_1 given a goal: head straight for the right edge.
-export const steer: FlockAgent["steer"] = () => 0;
+// Look-ahead steering: try headings fanned around "straight right", fly the one whose path stays
+// clearest of the obstacles in sight, prefer small turns and the current heading, and keep off neighbours.
+const ANGLES = 25, FAN = 1.5, LOOK = 54, STEP = 6, MARGIN = 5;
+const SEP_AT = 4, SEP = 10, SEP_W = 20;
+
+export const steer: FlockAgent["steer"] = (me, neighbours, obstacles, world) => {
+  let best = 0, bestCost = Infinity;
+  for (let i = 0; i < ANGLES; i++) {
+    const a = -FAN + (2 * FAN * i) / (ANGLES - 1);
+    const c = Math.cos(a), s = Math.sin(a);
+    let cost = Math.abs(a) * 1.5 + Math.abs(a - me.heading) * 0.8;
+    for (let d = STEP; d <= LOOK; d += STEP) {
+      const px = c * d, py = s * d;
+      for (const o of obstacles) {
+        const gap = Math.hypot(o.dx - px, o.dy - py) - o.r - MARGIN;
+        if (gap < 0) cost += (1 - gap / MARGIN) * 40 * (1 - d / (LOOK + STEP));
+      }
+      const y = me.y + py;
+      if (y < 8 || y > world.height - 8) cost += 6;
+    }
+    for (const n of neighbours) {
+      const dist = Math.hypot(n.dx - c * SEP_AT, n.dy - s * SEP_AT);
+      if (dist < SEP) cost += (SEP - dist) * SEP_W;
+    }
+    if (cost < bestCost) { bestCost = cost; best = a; }
+  }
+  return best;
+};
```
