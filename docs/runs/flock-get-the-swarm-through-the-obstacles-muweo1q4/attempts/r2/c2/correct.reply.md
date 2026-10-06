I edited `problems/flock/agent.ts` to address all five problems. I didn't run the tests or the judge, as instructed, so none of it is scored.

1. **Pruning:** the progress credit is now subtracted each step, so the running cost matches the final cost. The early exit only fires when the cost minus the most credit the remaining steps could add is still at least `bestCost`. A pruned candidate is skipped and can no longer be picked as best.
2. **Constants:** I read `judge/flock/world.ts`, which defines `SPEED = 2` and `MAX_TURN = 0.15`. The agent had `4` and `0.3`, so I corrected `SPEED` and `TURN`. The neighbour and obstacle offsets are relative `dx`/`dy`, and neighbour headings are absolute, so the rollout model was already in the right frame. Lookahead is now `STEPS = 30` (60 px), which matches the judge's obstacle sensing range of 60.
3. **`me.y` and `world.height`:** both exist in the judge's types, so the wall term works and type-checks.
4. **Nothing-in-view case:** I removed the early `return 0`. The rollout's keep-heading term now handles that case instead of snapping to heading 0.
5. **Fan width and cost:** I narrowed `FAN` to 1.4 (about ±80°). Per-agent work is cut by pruning, and I didn't change the budget handling. I did not tune `W_NB`, `W_OBS` or `TN`. The judge has a `budgetMs` time limit, but I haven't measured whether this agent fits inside it.

The agent still uses only `Math.*` and `import type`, which the source rules in `judge/check.ts` allow.
