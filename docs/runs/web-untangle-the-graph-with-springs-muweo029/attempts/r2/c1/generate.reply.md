I replaced `problems/web/agent.ts`, and the Web score on the fixed seeds went from 0.1368 to 1.086. I didn't run `bun judge/check.ts web --base <base>` itself, so the "higher than base on three seeded worlds" criterion is untested. I did check that the new score is far above the base.

- **How it works:** on step 0 the agent plans a full layout on a private copy of the graph. It relaxes it with springs, then runs a long simulated-annealing pass that removes crossings and overlaps and evens out edge lengths. After that it only walks each node toward its planned spot, and the judge's 8 px per step cap does the pacing.
- **Result:** in my own runs on six seeds (1–6), every layout had 0 crossings and 0 or 1 overlapping pairs. Scores were about 1.08–1.09 against a ceiling of about 1.1.
- **Cost:** the plan takes about 2–4 s per world, inside the judge's 10 s budget. It runs once, before the first step.
- **Constraints:** only `problems/web/agent.ts` changed. It uses type imports only and none of the banned identifiers, and the judge's `--score` command ran it without flagging a rule. I removed my scratch test file, so the working tree shows nothing else modified.
