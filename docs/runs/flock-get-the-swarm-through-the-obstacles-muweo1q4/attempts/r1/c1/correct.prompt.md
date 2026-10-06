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
- 1: uncertain. The diff has no score or run output. The logic is plausible: it steers along the tangent of each obstacle ahead, and the tangent orientation checks out for y-down coordinates. The constants (65, 55, 20, 14, 0.15) look untuned, and nothing shows the result beats the base's `() => 0` on all three seeded worlds.
- 2: uncertain. Only `problems/flock/agent.ts` changes, so the path rule is met. The diff cannot show that the code keeps to the source rules in `judge/check.ts`. It uses `Math.hypot`, `Math.atan2` and `world.height`, and none of these is checked against those rules.

PROBLEMS:
1. problems/flock/agent.ts: `dist` can be 0 when an agent sits exactly on an obstacle centre. Then `ux` and `uy` become NaN, the NaN reaches `vx` and `vy`, and `steer` returns NaN. Guard it, for example `if (dist === 0) continue;` or `Math.max(dist, 1e-6)`.
2. problems/flock/agent.ts: `if (lane < 10 || lane > world.height - 10) side = -side;` flips the side without checking that the other side has room. If both lanes are out of bounds, the agent still flips and can steer into a wall. The only fallback is the weak 0.5 wall nudge.
3. problems/flock/agent.ts: obstacles are handled one at a time and their pushes are summed. Two close obstacles can pull in opposite directions and cancel, which leaves the agent stuck in the gap between them. Nothing deals with this.
4. problems/flock/agent.ts: `Math.atan2(vy, Math.max(vx, 0.05))` clamps the heading to the forward half-plane. An agent that hits an obstacle head-on and is pushed backward (`vx < 0` from the push-off term) cannot turn back or slide around it. It can only head almost straight up or down.
5. problems/flock/agent.ts: the "already past it" test `o.dx < -o.r` ignores the agent's own radius or clearance, so the agent stops avoiding while its body may still overlap the obstacle. Whether that counts as a collision depends on judge code I cannot see.

## Current diff
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
