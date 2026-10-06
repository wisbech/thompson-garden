I replaced `problems/slime/agent.ts` with a new rule. On the fixed seeds `bun judge/check.ts slime --score` now gives 0.1363, up from the 0.0222 baseline. I did not run `check.ts slime --base <base>` itself, so the pass/fail check is unconfirmed. I also didn't run the project's tests or `bun judge/check.ts all --score`.

- **What changed:** each agent now steers toward a trail level of 2.5, just above the 1.5 network threshold, instead of toward the strongest trail. Following the strongest trail collapses all the agents into one fat band that misses most foods. On blank ground an agent drifts almost straight, and the food cells (trail 10) push agents out along straight rays that find the other foods.
- **Parameters:** sensors at 0.5 rad and 8 cells out, step size 1.5, deposit 0.8.
- **Seeds 1–3:** all three seeds join every food (0.136, 0.139 and 0.134).
- **Extra seeds 4–11:** seven of the eight join every food, for a mean of 0.128. The one miss (seed 7) joined 67% of food pairs and scored 0.067.
- **Not lean:** the networks are about 6,400 cells. A lean tree would reach about 1.1, so the score is well short of that.
- **Rules and scope:** the file uses type imports only, and I changed nothing else.
