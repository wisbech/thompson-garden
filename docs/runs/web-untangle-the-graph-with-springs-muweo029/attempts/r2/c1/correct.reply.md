I fixed three of the four problems in `problems/web/agent.ts`. I did not run the tests, as instructed, so there is still no score evidence.

- **Step clamp (problem 1):** `forces` now clamps each node's step to 8 px, which matches `MAX_MOVE` in `judge/web/world.ts`. The worst-case walk is about 112 steps out of 600.
- **Run time (problem 2):** the world gives each run a 10 s budget (`BUDGET_MS`) and stops stepping once it is exceeded. The planning pass runs inside step 0, so a slow plan would have cut the run short. I made three changes:
  - Annealing is now capped at 30,000 iterations instead of 200,000.
  - It also stops at a 2.5 s wall-clock limit. `performance.now()` is allowed by the source rules in `judge/check.ts`.
  - The annealing schedule now follows whichever of iteration progress or elapsed time is further along, so it cools properly if cut short.
  - I also dropped the `inc[v].includes` check in `local()`. It only double-counted crossings between edges that both touch the node, and `local()` is only used to compare before and after.
- **Constants and RNG (problem 3):** no change needed. The score in `measure()` has no rest length. It uses 1/(1+crossings), a bonus for even edge lengths, and a penalty for node pairs closer than 16 px. My margin of 20 is inside the world's 10, and my overlap threshold of 40 is stricter than the judge's 16. `ctx.random` is the intended RNG, so drawing from it is fine.
- **Transit (problem 4):** no change needed. `measure()` runs only on the final positions, so crossings during the walk are not penalised.

I confirmed `ctx.random`, `ctx.width` and `ctx.height` exist on `WebContext`. Nothing else changed.
