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
