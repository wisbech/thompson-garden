I changed `problems/slime/agent.ts` only. It now uses wider sensors that reach further ahead and a quicker step. The judge's `--base` check has not been run, so I can't say the card passes.

- **Settings:** sensors at 0.9 rad, 15 cells out; step size 2; deposit 1; turn of 0.9 rad toward the strongest side. I found them with a sweep over 128 combinations on six seeds I picked myself.
- **Fixed seeds:** `bun judge/check.ts slime --score` went from 0.0222 to 0.0422. That was a single run of the chosen settings.
- **My six seeds:** the mean score was 0.103, but only 3 of the 6 worlds ended up with every food joined. Connection is still hit-and-miss.
- **Judged worlds:** the score depends on the seeds drawn from the commit. I expect the agent to beat the base, but I can't promise it on those three seeds.
- **Rules:** the file uses only `import type` and has none of the banned constructs.
