CRITERIA:
- 1: uncertain. The diff has no score or run output. The logic is plausible: it steers along the tangent of each obstacle ahead, and the tangent orientation checks out for y-down coordinates. The constants (65, 55, 20, 14, 0.15) look untuned, and nothing shows the result beats the base's `() => 0` on all three seeded worlds.
- 2: uncertain. Only `problems/flock/agent.ts` changes, so the path rule is met. The diff cannot show that the code keeps to the source rules in `judge/check.ts`. It uses `Math.hypot`, `Math.atan2` and `world.height`, and none of these is checked against those rules.

PROBLEMS:
1. problems/flock/agent.ts: `dist` can be 0 when an agent sits exactly on an obstacle centre. Then `ux` and `uy` become NaN, the NaN reaches `vx` and `vy`, and `steer` returns NaN. Guard it, for example `if (dist === 0) continue;` or `Math.max(dist, 1e-6)`.
2. problems/flock/agent.ts: `if (lane < 10 || lane > world.height - 10) side = -side;` flips the side without checking that the other side has room. If both lanes are out of bounds, the agent still flips and can steer into a wall. The only fallback is the weak 0.5 wall nudge.
3. problems/flock/agent.ts: obstacles are handled one at a time and their pushes are summed. Two close obstacles can pull in opposite directions and cancel, which leaves the agent stuck in the gap between them. Nothing deals with this.
4. problems/flock/agent.ts: `Math.atan2(vy, Math.max(vx, 0.05))` clamps the heading to the forward half-plane. An agent that hits an obstacle head-on and is pushed backward (`vx < 0` from the push-off term) cannot turn back or slide around it. It can only head almost straight up or down.
5. problems/flock/agent.ts: the "already past it" test `o.dx < -o.r` ignores the agent's own radius or clearance, so the agent stops avoiding while its body may still overlap the obstacle. Whether that counts as a collision depends on judge code I cannot see.
