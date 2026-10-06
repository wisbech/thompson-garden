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
- 1: uncertain. The diff gives no scores, and I haven't run `judge/check.ts`. The steering is plausible: it takes a tangent around the nearest obstacle ahead and picks the lane with more room. Nothing in the diff shows it beats the base on three seeded worlds.
- 2: pass. Only `problems/flock/agent.ts` changes, and it keeps the type-only import. I can't see `judge/check.ts`, so I can't confirm the source rules. The code uses only `Math.*` and no randomness or I/O, so I found no violation.

PROBLEMS:
1. `problems/flock/agent.ts`: the first loop picks `near` using `Math.hypot(o.dx,o.dy) - o.r` over all obstacles ahead, with no range limit. A distant obstacle can win and get `w = 0`, which is harmless. But `side` is derived from `o.dy > 0 ? -1 : 1` each step, with only the room comparison to break ties. For an obstacle almost dead ahead (`dy ≈ 0`) and roughly equal room on both sides, `side` can flip from one step to the next. The agent then pushes straight into the obstacle or jitters in front of it. Add hysteresis or a deterministic tie-break, for example by the agent's own `me.y` or by room with a margin.
2. `problems/flock/agent.ts`: only the single nearest obstacle gets tangent steering. Two obstacles close together (a gate or a staggered pair) are handled by the nearest one alone, so the swarm can be steered into the second one. The `gap < 10` push-off is the only protection from the others. The comment claims this avoids cancellation, but it just ignores the second obstacle. This is a likely failure case for "get the swarm through the obstacles".
3. `problems/flock/agent.ts`: the `room` lane check is computed around the obstacle's own `y` and ignores other obstacles. It can choose a lane that is wider but blocked by the next obstacle.
4. `problems/flock/agent.ts`: the swarm gets only a separation term (`d < 14`). There is no alignment or cohesion, and the neighbour push uses unexplained constants (14, 0.15). The agent may therefore scatter and lose agents at the edges. The `me.y < 15` / `me.y > height - 15` nudges are weak (0.5) next to the obstacle terms (up to 4).
5. `problems/flock/agent.ts`: the first loop computes the `dist`/`gap` values that the second loop recomputes, which is redundant. This is minor, and the loops could be merged.

I found no wrong-path edits, but I can't confirm criterion 1 from the diff, so I'm not giving LGTM.

## Current diff
```diff
diff --git a/problems/flock/agent.ts b/problems/flock/agent.ts
index bea04d8..ef0e791 100644
--- a/problems/flock/agent.ts
+++ b/problems/flock/agent.ts
@@ -2,5 +2,40 @@
 // Self-contained: type imports only.
 import type { FlockAgent } from "../../judge/flock/world";
 
-// Baseline, the "stupid agent" of P_2_2_1 given a goal: head straight for the right edge.
-export const steer: FlockAgent["steer"] = () => 0;
+// Head for the right edge; slide around each obstacle ahead on the side with more room (a tangent to
+// its edge), push off when close, and keep a little distance from neighbours.
+export const steer: FlockAgent["steer"] = (me, neighbours, obstacles, world) => {
+  let vx = 1, vy = 0;
+  // Only the nearest obstacle ahead steers the swarm around it, so two close obstacles can't cancel out.
+  let near = -1, nearGap = Infinity;
+  for (let i = 0; i < obstacles.length; i++) {
+    const o = obstacles[i];
+    if (o.dx < -o.r - 6) continue;                          // already past it (with body clearance)
+    const g = Math.hypot(o.dx, o.dy) - o.r;
+    if (g < nearGap) { nearGap = g; near = i; }
+  }
+  for (let i = 0; i < obstacles.length; i++) {
+    const o = obstacles[i];
+    if (o.dx < -o.r - 6) continue;
+    const dist = Math.max(Math.hypot(o.dx, o.dy), 1e-6), gap = dist - o.r;
+    const ux = o.dx / dist, uy = o.dy / dist;
+    if (i === near) {
+      let side = o.dy > 0 ? -1 : 1;                         // -1: pass above, +1: pass below
+      const room = (s: number) => Math.min(me.y + o.dy + s * (o.r + 20) - 10, world.height - 10 - (me.y + o.dy + s * (o.r + 20)));
+      if (room(-side) > room(side)) side = -side;           // take the lane with more room
+      // tangent that turns away from the centre on that side
+      const tx = side > 0 ? -uy : uy, ty = side > 0 ? ux : -ux;
+      const w = Math.max(0, Math.min(1, (65 - gap) / 55));
+      const k = w * w * 4;
+      vx += k * tx; vy += k * ty;
+    }
+    if (gap < 10) { const p = (1 - gap / 10) * 4; vx -= ux * p; vy -= uy * p; }
+  }
+  for (const n of neighbours) {
+    const d = Math.hypot(n.dx, n.dy);
+    if (d < 14 && d > 0) { vx -= (n.dx / d) * (14 - d) * 0.15; vy -= (n.dy / d) * (14 - d) * 0.15; }
+  }
+  if (me.y < 15) vy += 0.5;
+  if (me.y > world.height - 15) vy -= 0.5;
+  return Math.atan2(vy, vx);
+};
```
