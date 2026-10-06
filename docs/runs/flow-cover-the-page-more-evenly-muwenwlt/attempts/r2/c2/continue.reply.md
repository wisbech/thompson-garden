I tuned `problems/flow/agent.ts`, and the fixed-seed score is now 0.8810, up from the 0.8282 baseline. I ran `bun judge/check.ts flow --score` and nothing else: I did not run `--base <sha>`, the tests or the full `all --score` measure. The agent's source passes the rules in `judge/check.ts`.

The agent seeds each new trail one spacing beside an existing one (Jobard-Lefer), working outward through the trails in the order they were made. It falls back to random starts when no such place is left.

I changed two things from the previous attempt:
- **Seed distance:** from 1.01 to 1.001 times the spacing, so seeds sit as close to the existing trail as the judge allows.
- **Candidate points:** it still takes every second point along a trail as a candidate. I tried every point and it scored lower (0.8797).

The 1.01 spacing with every second point scored 0.8726. Only `problems/flow/` changes.
