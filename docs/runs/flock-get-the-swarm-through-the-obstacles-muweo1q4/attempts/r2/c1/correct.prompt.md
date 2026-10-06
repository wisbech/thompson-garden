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
- 1: uncertain. The diff swaps the baseline `() => 0` for a 25-heading look-ahead that penalises obstacle proximity, walls and neighbours. A higher score on three worlds can only be shown by running `bun judge/check.ts flock --base <base>`, and I was told not to run anything.
- 2: uncertain. Only `problems/flock/agent.ts` changes, so the path rule holds. The source rules in `judge/check.ts` aren't in the diff. I see no `Math.random`, no imports beyond the type import, and no state, but I can't confirm the rules allow everything used (for example `me.heading` and `world.height`).

PROBLEMS:
1. problems/flock/agent.ts: `me.heading` is read in the cost term `Math.abs(a - me.heading)`, but nothing in the diff shows that field exists on the agent type or that it is an absolute angle in the same frame as `a`. If it is missing, the cost becomes NaN and `cost < bestCost` is always false, so the agent returns 0, which is the baseline. If it is a relative angle, the turn-smoothing term is wrong. Check it against `judge/flock/world`.
2. problems/flock/agent.ts: obstacle offsets are compared against `(c*d, s*d)` straight from `me`, which assumes `o.dx`/`o.dy` are world-axis offsets. They would be wrong if the world gives them in the agent's heading frame. Confirm the frame in `judge/flock/world`.
3. problems/flock/agent.ts: the obstacle penalty scales with `(1 - d/(LOOK+STEP))`, which weights near-path collisions most, but only the nearest 54 units are probed. If obstacles have a larger visible range or radius, the agent turns too late. The constants (`MARGIN=5`, `LOOK=54`, weights 40, 20, 1.5, 0.8) look hand-tuned with nothing in the diff to justify them. This is a risk to criterion 1, not a proven fault.
4. problems/flock/agent.ts: the separation term probes only `SEP_AT=4` ahead and ignores neighbour velocity. Two agents heading the same way will barely register each other, so it may do little against collisions. This is minor.

I can't pass criterion 1 or 2 from the diff alone, so there is no LGTM.

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
