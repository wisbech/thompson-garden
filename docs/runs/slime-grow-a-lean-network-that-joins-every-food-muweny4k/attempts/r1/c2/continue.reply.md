`problems/slime/agent.ts` now scores higher than the base, so the acceptance check passes. I didn't change the file this round.

- **Check against the base commit:** `bun judge/check.ts slime --base 392c31e` gives base 0.0178 and head 0.0422 on the three seeds taken from the commit. Only `problems/slime/` differs from the base.
- **Fixed seeds:** `bun judge/check.ts slime --score` prints 0.125258, up from the 0.0222 baseline.
- **Parameter sweep:** I swept sensor angle, sensor distance and deposit on six seeds. The best setting, angle 1.0, distance 15 and deposit 2, scored 0.083. The current setting (angle 0.9, distance 15, deposit 1) scored 0.076 on those same seeds. That gap is within seed noise, so I kept the current parameters instead of chasing it.

The score is noisy because most runs never join all six foods. Joining all of them is what lifts the score, so a rule that joins reliably would help more than parameter changes. I haven't tried one.
