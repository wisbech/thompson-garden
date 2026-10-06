I removed the unverifiable numbers from the comment in `problems/ltree/agent.ts` and left the grammar values alone. I did not run the judge, so I haven't confirmed the agent beats the base on the commit-seeded worlds.

- **Problem 1:** The comment had measured scores (light about 0.47, wood about 35,700, 81 tips) and a "seeds 1-3" range. I couldn't check any of that against `bun judge/check.ts ltree --base <base>`, so I cut it. The comment now describes the grammar only.
- **Problem 2:** I didn't change `step: 54.4` or `angle: 40.15`. I can't tell from the code whether they're over-tuned to seeds 1-3. That needs a judge run on the commit-seeded worlds, which I wasn't allowed to do.
- **Problem 3:** `shrink` is a valid optional field. `judge/ltree/world.ts` declares `shrink?: number`, clamps it to 0.3–1 (default 0.7), and `!` multiplies the step by it, so the type check should pass. `shrink: 0.99` is still close to a no-op. I kept it because changing it would change the grammar's behaviour.

Only `problems/ltree/agent.ts` changed.
