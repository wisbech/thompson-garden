# role: correct

You are the corrector on card slime-grow-a-lean-network-that-joins-every-food-muweny4k: slime: grow a lean network that joins every food. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
slime: grow a lean network that joins every food

## Acceptance
- problems/slime/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts slime --base <base>)
- only problems/slime/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
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

## Current diff
```diff
diff --git a/problems/slime/agent.ts b/problems/slime/agent.ts
index 8b5bc50..7a0fc1f 100644
--- a/problems/slime/agent.ts
+++ b/problems/slime/agent.ts
@@ -1,13 +1,16 @@
-// The Slime agent: how each of the 3,000 agents senses, turns and deposits. The only file a Slime card changes.
+// The agent: a trail agent that one rule keeps wide awake.
 // Self-contained: type imports only.
 import type { SlimeAgent } from "../../judge/slime/world";
 
-// Baseline: Jones' (2010) rule and angles: sensors at 45°, 9 cells out, turn 45° toward the strongest.
-export const params: SlimeAgent["params"] = { sensorAngle: Math.PI / 4, sensorDistance: 9, stepSize: 1, deposit: 1 };
+// What the world rewards first is one piece of network that holds every food; Jones' rule alone leaves thick
+// bands that miss foods. So the agents wander widely (step 2, strong deposit, big random wobble) and only lean
+// gently toward trail, which lays a thin, even mesh that reaches every food, the food cells included.
+export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 12, stepSize: 2, deposit: 4 };
+
+const TURN = 0.1, WOBBLE = 1;
 
 export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
-  const ra = Math.PI / 4;
-  if (center >= left && center >= right) return 0;
-  if (center < left && center < right) return random() < 0.5 ? -ra : ra;
-  return left > right ? -ra : ra;
+  if (center >= left && center >= right) return (random() - 0.5) * WOBBLE;
+  if (center < left && center < right) return random() < 0.5 ? -TURN : TURN;
+  return left > right ? -TURN : TURN;
 };
```
