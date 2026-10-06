I made no new changes. The previous attempt's `problems/flock/agent.ts` already meets both acceptance criteria.

- **Check result:** `bun judge/check.ts flock --base <base>` passes. The mean over the three seeded worlds rises from 0.027 at the base to 0.650.
- **Worlds:** per-world scores are 0.458, 0.647 and 0.846. The fixed-seed score from `--score` is 0.805, against the 0.0183 baseline.
- **Extra clearance:** I tried a wider push-off from obstacles. It lowered the three-world mean to 0.595, so I put the file back as it was.
- **Remaining losses:** the worst world (seed 2924839365) still loses 68 of 200 agents and has 101 collisions.
- **Scope:** only `problems/flock/` is touched. I did not run the project's tests, and I did not measure the project-wide score (`bun judge/check.ts all --score`).
