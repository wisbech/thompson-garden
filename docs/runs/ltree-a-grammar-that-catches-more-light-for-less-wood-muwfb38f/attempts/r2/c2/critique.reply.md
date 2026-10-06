CRITERIA:
- 1: uncertain. The diff only claims scores in a comment (about 0.29-0.31 against about -0.03 for the base, on "seeds 1-3"). I can't run the judge, and the comment doesn't say these are the commit-seeded worlds. Nothing in the diff proves the improvement.
- 2: uncertain. Only `problems/ltree/agent.ts` changes, so the path rule holds. Whether the source rules in `judge/check.ts` allow the `!` symbol, the `shrink` field and the unusual `step`/`angle` values can't be seen from the diff.

PROBLEMS:
1. problems/ltree/agent.ts: The new comment gives measured scores (light about 0.47, wood about 35,700, 81 tips) and a seed range that the diff can't back up. Check each figure against `bun judge/check.ts ltree --base <base>` on the commit-seeded worlds. Otherwise drop the numbers, since a stale or wrong claim in a comment misleads later cards.
2. problems/ltree/agent.ts: `step: 54.4` and `angle: 40.15` look tuned to the specific seeds. They may score well on seeds 1-3 and not on other seeds. Confirm the agent also beats the base on the three worlds the judge actually seeds from the commit.
3. problems/ltree/agent.ts: `shrink: 0.99` is a near-no-op, so `!` barely changes the step. The comment calls this "almost no shrinking", but the rule still pays for a `!` in every expansion. Confirm `shrink` is a valid optional field of `LTreeAgent["grammar"]`, or the type check will fail.
