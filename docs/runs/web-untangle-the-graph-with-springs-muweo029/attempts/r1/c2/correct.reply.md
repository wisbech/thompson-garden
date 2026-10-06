I edited `problems/web/agent.ts` to address the critique. I didn't run any tests or `judge/check.ts`, as instructed, so there is no score yet to show a gain over base.

I read `judge/web/world.ts` first. It showed that points 1–4 and 6 of the critique rested on guesses about the judge.

1. **Schedule:** the judge runs 600 steps and passes that as `ctx.steps`. The hard-coded 300/450/540 is gone. The cycle ends and the walk-back start are now fractions of `ctx.steps` (0.5, 0.75, 0.9). That leaves about 60 steps to walk back to the best layout.
2. **Return meaning:** the judge treats the return as a per-step displacement and caps it at 8 px. That fits both the clamped cooling moves and the `best - p` walk-back, and I added comments saying so.
3. **Natural length:** I dropped the `* 0.2` factor, so `k` is now `sqrt(area/n)`, about 96 px. That is well above the 16 px overlap threshold. I haven't tuned it against the judge.
4. **Bounds:** the judge already clamps positions to a 10 px margin, so nothing was penalised. I now clamp the desired target to the same margin before returning the displacement, so no force is wasted pushing against the wall.
5. **Quality proxy:** it already matches the judge's `measure` formula, including the 16 px overlap radius (`2 * RADIUS`) and the 0.1 and 0.02 weights, so I left it unchanged.
6. **Cost:** with about 70 edges it is roughly 2,400 crossing tests plus 1,200 overlap tests per step. That is cheap at 600 steps, so I left it.

The agent still has only a type import and no new banned constructs, so it should pass the source rules in `judge/check.ts`.
