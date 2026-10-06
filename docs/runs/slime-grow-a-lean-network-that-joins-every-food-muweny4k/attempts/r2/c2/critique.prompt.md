# role: critique

You are the critic on card slime-grow-a-lean-network-that-joins-every-food-muweny4k: slime: grow a lean network that joins every food. Read the diff below against the task and the acceptance criteria.
Assume every change is wrong until the diff itself justifies it; the burden of proof is on the diff, not on you.

Name concrete errors only: wrong logic, a missing case, a criterion the diff does not meet, an edit to a
protected path, a change the task did not ask for. Do not edit any file and do not run anything.

Reply in this form, one line per acceptance criterion, in their order:

CRITERIA:
- 1: pass|fail|uncertain — the evidence in the diff, in one line
- 2: ...
PROBLEMS:
1. <file>: <what is wrong and what to change>
2. ...

If every criterion passes and you find no problem, end your reply with a line that is exactly: LGTM

## Task
slime: grow a lean network that joins every food

## Acceptance
- problems/slime/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts slime --base <base>)
- only problems/slime/ changes; the agent keeps to the source rules in judge/check.ts

## Protected paths
checks/
src/kernel/
KERNEL.md
CODEOWNERS
thompson.json
package.json
bunfig.toml
bun.lock
bun.lockb
package-lock.json
yarn.lock
pnpm-lock.yaml
judge/
site/
docs/
tsconfig.json
README.md

Mechanism paths (this is an ordinary card; a rollout that touches them is refused by the host before the judge):
adapters/
src/

## Diff
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
