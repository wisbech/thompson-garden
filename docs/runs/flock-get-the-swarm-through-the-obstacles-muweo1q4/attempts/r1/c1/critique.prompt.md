# role: critique

You are the critic on card flock-get-the-swarm-through-the-obstacles-muweo1q4: flock: get the swarm through the obstacles. Read the diff below against the task and the acceptance criteria.
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
flock: get the swarm through the obstacles

## Acceptance
- problems/flock/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flock --base <base>)
- only problems/flock/ changes; the agent keeps to the source rules in judge/check.ts

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
diff --git a/problems/flock/agent.ts b/problems/flock/agent.ts
index bea04d8..280ae7d 100644
--- a/problems/flock/agent.ts
+++ b/problems/flock/agent.ts
@@ -2,5 +2,29 @@
 // Self-contained: type imports only.
 import type { FlockAgent } from "../../judge/flock/world";
 
-// Baseline, the "stupid agent" of P_2_2_1 given a goal: head straight for the right edge.
-export const steer: FlockAgent["steer"] = () => 0;
+// Head for the right edge; slide around each obstacle ahead on the side with more room (a tangent to
+// its edge), push off when close, and keep a little distance from neighbours.
+export const steer: FlockAgent["steer"] = (me, neighbours, obstacles, world) => {
+  let vx = 1, vy = 0;
+  for (const o of obstacles) {
+    if (o.dx < -o.r) continue;                              // already past it
+    const dist = Math.hypot(o.dx, o.dy), gap = dist - o.r;
+    const ux = o.dx / dist, uy = o.dy / dist;
+    let side = o.dy > 0 ? -1 : 1;                           // -1: pass above, +1: pass below
+    const lane = me.y + o.dy + side * (o.r + 20);
+    if (lane < 10 || lane > world.height - 10) side = -side;
+    // tangent that turns away from the centre on that side
+    const tx = side > 0 ? -uy : uy, ty = side > 0 ? ux : -ux;
+    const w = Math.max(0, Math.min(1, (65 - gap) / 55));
+    const k = w * w * 4;
+    vx += k * tx; vy += k * ty;
+    if (gap < 10) { const p = (1 - gap / 10) * 4; vx -= ux * p; vy -= uy * p; }
+  }
+  for (const n of neighbours) {
+    const d = Math.hypot(n.dx, n.dy);
+    if (d < 14 && d > 0) { vx -= (n.dx / d) * (14 - d) * 0.15; vy -= (n.dy / d) * (14 - d) * 0.15; }
+  }
+  if (me.y < 15) vy += 0.5;
+  if (me.y > world.height - 15) vy -= 0.5;
+  return Math.atan2(vy, Math.max(vx, 0.05));
+};
```
