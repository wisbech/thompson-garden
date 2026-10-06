I changed only comments in `problems/slime/agent.ts` and left the parameters alone. Measurement didn't support problems 1 to 3, so I didn't change the values. I ran `bun judge/check.ts slime --score` on about 17 settings, not the project's tests.

- **Problems 1 and 2 (wobble, turn, deposit):**
  - The current agent scores 0.114 on the fixed seeds. Jones' baseline rule (45°, 9 cells out, step 1, deposit 1, turn 45°) scores 0.011.
  - Cutting the wobble, raising the turn, or weakening the deposit all scored lower, between 0.01 and 0.04. The one sibling that did better was sensorAngle 0.4 with sensorDistance 14, at 0.115, which is a negligible gain, so I didn't switch to it.
  - A wide wobble with a gentle turn is what connects the foods. A connected network scores 0.1 plus the MST length over the network's cell count, so reaching every food comes first.
- **Problem 3 (stepping over food):** each food is a 3x3 block held at full trail every step by the judge (`judge/slime/world.ts`). A step of 2 can't skip it, and agents sense it from 12 cells away. The comment now says this instead of implying the agent handles it.
- **Problem 4 (source rules):** the values are inside the judge's limits (sensor distance up to 20, step up to 2, deposit up to 5). `turn` is clamped to ±π/2 and the judge accepts non-integer values. The source has only `import type`, so none of the source rules in `judge/check.ts` are broken.
- **Problem 5 (header comment):** I restored the original header, "The only file a Slime card changes". The explanatory comment now includes the measured scores.

I didn't run `--base`, so there's no head-versus-base result on the sha-seeded worlds yet.
