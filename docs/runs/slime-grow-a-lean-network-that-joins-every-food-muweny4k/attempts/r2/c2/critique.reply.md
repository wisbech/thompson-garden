CRITERIA:
- 1: uncertain. The diff gives no evidence of a score gain, and I can't run `judge/check.ts`. The design works against the stated goal of a lean network (see problems 1 to 3).
- 2: uncertain. Only `problems/slime/agent.ts` changes, so the path rule passes. I can't see the source rules in `judge/check.ts`, so I can't confirm the new `params` values or the continuous `turn` return fit them (problem 4).

PROBLEMS:
1. problems/slime/agent.ts: The wobble is ±0.5 rad whenever the center sensor is strongest, but the turn toward trail is only 0.1 rad. Noise is five times the steering, so agents are close to random walkers. That is unlikely to form connected, lean paths between foods. Cut `WOBBLE` or raise `TURN` and show the effect with a run.
2. problems/slime/agent.ts: `deposit: 4` with `stepSize: 2` lays four times the trail per cell on a doubled path. This favors thick, saturated blobs over the "lean" network the task asks for. The comment calls the result a "thin, even mesh", but nothing in the diff supports that.
3. problems/slime/agent.ts: With `stepSize: 2`, agents can step over single food cells. The comment says the food cells are included, but the diff doesn't show how, so a food could be missed and connectivity lost.
4. problems/slime/agent.ts: `sensorAngle` 0.5, `sensorDistance` 12 and `stepSize` 2 all depart from the baseline. If `judge/check.ts` bounds them (for example integer steps or a maximum sensor distance), the agent could be rejected. Non-integer turn values could also break a source rule. Check the values against `judge/check.ts` before accepting.
5. problems/slime/agent.ts: The header comment "one rule keeps wide awake" is vague, and it drops the original file description ("The only file a Slime card changes"). Minor, but the doc is lost.

No LGTM: criterion 1 is unproven and the parameter choices look counterproductive.
