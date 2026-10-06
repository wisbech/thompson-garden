# role: correct

You are the corrector on card flock-get-the-swarm-through-the-obstacles-muweo1q4: flock: get the swarm through the obstacles. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
flock: get the swarm through the obstacles

## Acceptance
- problems/flock/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flock --base <base>)
- only problems/flock/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
CRITERIA:
- 1: uncertain — The diff has no score output, and I can't run the judge. The rollout steering is plausible, but it depends on judge constants I can't see here.
- 2: uncertain — Only `problems/flock/agent.ts` changes, so the path rule holds. I can't check the source rules in `judge/check.ts` from the diff. The file uses `Math.*` and type imports only, but I can't tell whether `Math` or the `world` argument are allowed.

PROBLEMS:
1. problems/flock/agent.ts: The pruning bound is invalid. The loop stops when `cost >= bestCost`, but `bestCost` already includes the `- 0.05 * x` progress credit, while the running `cost` doesn't. A candidate pruned at the cutoff could have won after its full-rollout credit. Worse, a truncated rollout falls through to `cost -= 0.05 * x` and the `cost < bestCost` check. It is then compared with full rollouts using a smaller `x` and fewer steps charged, so it can be picked as best. Subtract the progress credit inside the bound, or drop the early exit.
2. problems/flock/agent.ts: `SPEED = 4`, `TURN = 0.3` and the neighbour model `n.dx + SPEED*t*cos(n.heading)` are copied from the judge by guess. Nothing in the diff shows these match `judge/flock/world`. If the judge's speed or turn rate differs, or `neighbours` and `obstacles` are in a different frame, every rollout is wrong. Read the values from `world` if it exposes them, or confirm them against the judge.
3. problems/flock/agent.ts: `me.y` and `world.height` are used for the wall term. The diff doesn't show that `FlockAgent`'s `me` carries `y` or that `world` carries `height`. If they don't exist, `py` is NaN and the wall penalty never fires. If `me.y` is missing, `bun judge/check.ts` fails type-checking.
4. problems/flock/agent.ts: `if (obstacles.length === 0 && neighbours.length === 0) return 0;` makes an agent snap to heading 0 whenever nothing is in view. It ignores `me.heading`, and the turn-limited flight in the judge can make that a sharp change. Bias toward the current heading instead.
5. problems/flock/agent.ts: The `TN = 4` cap on neighbour lookahead and the constants (`W_NB = 500`, `W_OBS = 100`, `FAN = 1.6`) are untuned and unexplained. The fan also covers about ±92°, so some targets are never useful. Per-agent work is 17 × 22 × (obstacles + neighbours) per tick. If the judge has a time budget, this could trip it, and I can't see the budget.

## Current diff
```diff
diff --git a/problems/flock/agent.ts b/problems/flock/agent.ts
index bea04d8..87b37a4 100644
--- a/problems/flock/agent.ts
+++ b/problems/flock/agent.ts
@@ -1,6 +1,44 @@
-// The Flock agent: the heading each agent wants. The only file a Flock card changes.
+// Flock agent. Edit this file only.
 // Self-contained: type imports only.
 import type { FlockAgent } from "../../judge/flock/world";
 
-// Baseline, the "stupid agent" of P_2_2_1 given a goal: head straight for the right edge.
-export const steer: FlockAgent["steer"] = () => 0;
+// Rollout steering: for each candidate target heading fanned around "straight right", simulate the
+// judge's own turn-limited flight a few dozen steps ahead, charge for obstacles and neighbours met on
+// the way, add a small pull toward the goal heading and toward the current choice, fly the cheapest.
+const N = 17, FAN = 1.6, STEPS = 22, SPEED = 4, TURN = 0.3;
+const TN = 4;
+const MARGIN = 3, NEAR = 6, W_OBS = 100, W_NB = 500, W_GOAL = 2, W_KEEP = 1;
+
+export const steer: FlockAgent["steer"] = (me, neighbours, obstacles, world) => {
+  if (obstacles.length === 0 && neighbours.length === 0) return 0;
+  let best = 0, bestCost = Infinity;
+  for (let k = 0; k < N; k++) {
+    // centre outward, so the cheap straight options set the bound early
+    const i = (N >> 1) + (k & 1 ? (k + 1) >> 1 : -(k >> 1));
+    const target = -FAN + (2 * FAN * i) / (N - 1);
+    let h = me.heading, x = 0, y = 0;
+    let cost = W_GOAL * Math.abs(target) + W_KEEP * Math.abs(target - me.heading);
+    for (let t = 1; t <= STEPS && cost < bestCost; t++) {
+      let d = target - h;
+      d = Math.atan2(Math.sin(d), Math.cos(d));
+      h += Math.max(-TURN, Math.min(TURN, d));
+      x += SPEED * Math.cos(h);
+      y += SPEED * Math.sin(h);
+      const w = 1 - t / (STEPS + 8);
+      for (const o of obstacles) {
+        const gap = Math.hypot(o.dx - x, o.dy - y) - o.r - MARGIN;
+        if (gap < 0) cost += W_OBS * w * (1 - gap / MARGIN);
+      }
+      const py = me.y + y;
+      if (py < 6 || py > world.height - 6) cost += 3;
+      if (t <= TN) for (const n of neighbours) {
+        const dist = Math.hypot(n.dx + SPEED * t * Math.cos(n.heading) - x, n.dy + SPEED * t * Math.sin(n.heading) - y);
+        if (dist < NEAR) cost += W_NB * (NEAR - dist) / NEAR * w;
+      }
+    }
+    // progress: how far right the rollout ends
+    cost -= 0.05 * x;
+    if (cost < bestCost) { bestCost = cost; best = target; }
+  }
+  return best;
+};
```
