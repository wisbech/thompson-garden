CRITERIA:
- 1: uncertain — The diff gives no score evidence. The numbers (angle 40.15, step 54.4, shrink 0.99) look tuned, but nothing shows they beat the base on three seeded worlds. Whether `shrink` and `!` are meaningful also depends on judge code I can't see here.
- 2: uncertain — Only `problems/ltree/agent.ts` changes, which fits the path rule. Whether `shrink` is an accepted field of the grammar return type, and whether `!` is a legal symbol, can't be confirmed from the diff. If either is outside the source rules in `judge/check.ts`, this fails.

PROBLEMS:
1. problems/ltree/agent.ts: `shrink: 0.99` is a field the base grammar never set. If `LTreeAgent["grammar"]` has no `shrink` key, the check fails or the field is ignored. Confirm it exists in `judge/ltree/world`.
2. problems/ltree/agent.ts: The rule uses `!`, which the base never used. If the judge's interpreter doesn't define `!` (for example, as a width or thickness change), it is either a no-op or a rejected symbol. If it is a no-op, the comment's claim of "few thick branches" is wrong. Confirm that the alphabet allows it.
3. problems/ltree/agent.ts: `F` has no rule, so it never lengthens, and `shrink` of 0.99 barely changes anything. The comment's reasoning ("each sun finds many tips for modest wood") is unsupported. With `X` expanding to 3 children per level over 5 iterations, the tip count is 3^5 = 243. At step 54.4 that is a lot of wood, which could cost more than the light it catches. The diff has no evidence either way, so the author needs to show the score.
4. problems/ltree/agent.ts: The step is 54.4, about 12 times the base's 4.5, and the axiom changed to `FX`. Segments may extend outside the frame or world bounds. If the judge clips or penalizes that, the score drops.
