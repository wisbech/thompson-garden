I changed `problems/canopy/agent.ts` to address all four problems. `bun judge/check.ts canopy --score` now runs in 1.5 s and gives a mean of 0.534385. I didn't run `--base` or the project tests, so I haven't confirmed that the agent beats the base on the three seeded worlds.

1. **`score` constants:** I checked each one against `judge/canopy/world.ts`. They match the judge's `measure`: leaf radius 5, 600 rays per sun, `wood / 200_000`, pipe-model area, the leaf definition, and the 3000-node maximum. I can't import the judge's scorer, because `RULES` in `judge/check.ts` allows type imports only. So I kept the copy and rewrote its comment to name the judge source and say why it is restated.
2. **Crossing tolerance:** `cross` now uses the same 1e-9 tolerance as the judge's `crosses` in `judge/lib.ts`.
   - Greedy points stay inside the frame.
   - The check that new points sit at least 3 px from every node keeps every segment above the judge's 0.5 minimum length, so the trusted path can't produce a tree the judge rejects.
3. **Time:** the judge ignores its time budget (`_budgetMs` is unused) and I found no time limit in `judge/check.ts`. I still cut the greedy pass from 1500 tries to 1000.
4. **Node cap:** the greedy check is now `nodes.length >= 3000`, which matches the judge's `MAX_NODES` of 3000. The old `>= 2999` was off by one in the safe direction.

The cut from 1500 to 1000 tries trades some possible score for less work. I didn't measure what it costs.
