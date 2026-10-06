Your previous attempt already meets both acceptance criteria, so I made no edits.

`bun judge/check.ts web --base 392c31e` passes. The mean score rises from 0.1353 to 1.0629 on the three commit-seeded worlds (2467796478, 1821298755, 2685079179).

- **Crossings:** all three worlds finish with zero crossings. The base had 13 to 35.
- **Overlaps:** two of the three worlds have one pair of nodes closer than 16 px.
- **Evenness:** 0.71 to 0.79. The remaining headroom is small, because a perfect layout scores about 1.1.
- **Source rules:** the agent breaks none. `performance.now()` is only called, never reassigned.
- **Scope:** only `problems/web/agent.ts` differs from the base.

I used `HEAD~3`'s parent-of-problem commit `392c31e` as `--base` because `HEAD~3` has no `problems/web/agent.ts`.

The planner stops after 2.5 s of wall-clock time as well as after 30,000 iterations. Results can therefore vary slightly between runs on a slower or busier machine.

I did not run the project's tests, as instructed.
