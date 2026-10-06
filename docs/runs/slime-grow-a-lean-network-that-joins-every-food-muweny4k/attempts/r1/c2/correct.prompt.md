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
- 1: uncertain. The diff gives no score evidence. It only changes the sensor angle (45° to about 51.6°) and the sensor distance (9 to 15). Nothing in it targets joining every food or keeping the network lean. A longer sensor distance can blur trails together and thicken the network, which would hurt leanness. Whether it beats the base on three seeded worlds is untested.
- 2: pass. Only `problems/slime/agent.ts` changes and the type-only import is kept. I can't see `judge/check.ts`, so I can't confirm the source rules are met, but nothing in the diff obviously breaks them.

PROBLEMS:
1. `problems/slime/agent.ts`: This is a two-constant parameter tweak, with no behavior that treats food specially and no rule that keeps the network lean. The task is "lean network that joins every food". Run `bun judge/check.ts slime --base <base>` and keep the change only if it scores higher on all three worlds. If it doesn't, add a real mechanism, or at least try smaller distance values (for example 9 to 12) and compare.
2. `problems/slime/agent.ts`: `turn` now reads `params.sensorAngle` from module scope. If the judge passes its own params or overrides them, the turn angle and the sensors can drift apart. Take the angle from the same source the judge uses for the sensors, or keep a single local constant used by both `params` and `turn`.
3. `problems/slime/agent.ts`: The comment says the step stays at 1 so agents don't skip thin trails or food. But `stepSize` is unchanged from the base, so the comment describes no change in this diff. It is also unsupported, because the longer sensor reach is the actual change.

## Current diff
```diff
diff --git a/problems/slime/agent.ts b/problems/slime/agent.ts
index 8b5bc50..2116c75 100644
--- a/problems/slime/agent.ts
+++ b/problems/slime/agent.ts
@@ -2,11 +2,12 @@
 // Self-contained: type imports only.
 import type { SlimeAgent } from "../../judge/slime/world";
 
-// Baseline: Jones' (2010) rule and angles: sensors at 45°, 9 cells out, turn 45° toward the strongest.
-export const params: SlimeAgent["params"] = { sensorAngle: Math.PI / 4, sensorDistance: 9, stepSize: 1, deposit: 1 };
+// Wider sensors reaching further ahead than the baseline (45°, 9 cells). The step stays at 1 so agents
+// cannot skip over thin trails or food cells. The turn angle follows the sensor angle.
+export const params: SlimeAgent["params"] = { sensorAngle: 0.9, sensorDistance: 15, stepSize: 1, deposit: 1 };
 
 export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
-  const ra = Math.PI / 4;
+  const ra = params.sensorAngle;
   if (center >= left && center >= right) return 0;
   if (center < left && center < right) return random() < 0.5 ? -ra : ra;
   return left > right ? -ra : ra;
```
