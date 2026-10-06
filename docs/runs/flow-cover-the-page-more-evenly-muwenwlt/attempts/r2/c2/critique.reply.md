CRITERIA:
- 1: uncertain. The diff swaps random starts for Jobard-Lefer seeding beside existing trails, which should raise coverage evenness. I was told not to run anything, so I can't confirm it beats the base on the three worlds. The diff also doesn't show `FlowWorld`, so I can't confirm that `world.trails`, `world.nearest` and `world.spacing` exist with the shapes the code assumes.
- 2: uncertain. Only `problems/flow/agent.ts` changes, and the import is type-only, so the path rule holds. I can't see `judge/check.ts`, so I can't tell whether its source rules ban anything the new code uses. The new code uses `WeakMap`, module-level state, `Math.atan2` and unbounded `for(;;)` loops. The base used none of these.

PROBLEMS:
1. problems/flow/agent.ts: `world.trails`, `world.nearest(x, y)` and `world.spacing` aren't used by the base agent, and nothing in the diff shows they exist. If a trail is not an array of `[x, y]` points, `t[i]`, `p[0]` and `q[1]` break at run time. Check against `judge/flow/world.ts` before accepting.
2. problems/flow/agent.ts: the `for(;;)` loop ends only when `w.done >= world.trails.length`. Every returned seed can add a trail, so this should end in practice, but each call can scan many candidates. Each candidate costs a `world.nearest` call. If `nearest` is linear in the number of trails, a time budget in the judge could be exceeded. The diff has no cap on work per call.
3. problems/flow/agent.ts: the module-level `WeakMap` keeps state between calls. If the check reuses one world object across runs or resets a world in place, `done` and `head` go stale and the agent skips trails. The comment's claim that each run starts clean depends on how the judge builds worlds, and the diff doesn't show that.
4. problems/flow/agent.ts: `i += 2` samples every second trail point. Seeds are therefore spaced by twice the integration step along the trail. This is fine only if the step is much smaller than `spacing`. The code doesn't tie the sampling stride to `spacing`. If steps are large, gaps are left that random fallback has to fill. This is a quality risk, not a proven bug.

I'm not ending with LGTM, because criteria 1 and 2 are uncertain.
