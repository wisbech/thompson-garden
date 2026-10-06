CRITERIA:
- 1: uncertain. The diff swaps the baseline `() => 0` for a 25-heading look-ahead that penalises obstacle proximity, walls and neighbours. A higher score on three worlds can only be shown by running `bun judge/check.ts flock --base <base>`, and I was told not to run anything.
- 2: uncertain. Only `problems/flock/agent.ts` changes, so the path rule holds. The source rules in `judge/check.ts` aren't in the diff. I see no `Math.random`, no imports beyond the type import, and no state, but I can't confirm the rules allow everything used (for example `me.heading` and `world.height`).

PROBLEMS:
1. problems/flock/agent.ts: `me.heading` is read in the cost term `Math.abs(a - me.heading)`, but nothing in the diff shows that field exists on the agent type or that it is an absolute angle in the same frame as `a`. If it is missing, the cost becomes NaN and `cost < bestCost` is always false, so the agent returns 0, which is the baseline. If it is a relative angle, the turn-smoothing term is wrong. Check it against `judge/flock/world`.
2. problems/flock/agent.ts: obstacle offsets are compared against `(c*d, s*d)` straight from `me`, which assumes `o.dx`/`o.dy` are world-axis offsets. They would be wrong if the world gives them in the agent's heading frame. Confirm the frame in `judge/flock/world`.
3. problems/flock/agent.ts: the obstacle penalty scales with `(1 - d/(LOOK+STEP))`, which weights near-path collisions most, but only the nearest 54 units are probed. If obstacles have a larger visible range or radius, the agent turns too late. The constants (`MARGIN=5`, `LOOK=54`, weights 40, 20, 1.5, 0.8) look hand-tuned with nothing in the diff to justify them. This is a risk to criterion 1, not a proven fault.
4. problems/flock/agent.ts: the separation term probes only `SEP_AT=4` ahead and ignores neighbour velocity. Two agents heading the same way will barely register each other, so it may do little against collisions. This is minor.

I can't pass criterion 1 or 2 from the diff alone, so there is no LGTM.
