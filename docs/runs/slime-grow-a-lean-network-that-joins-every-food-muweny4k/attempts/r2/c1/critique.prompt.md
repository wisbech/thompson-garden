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
index 8b5bc50..913483e 100644
--- a/problems/slime/agent.ts
+++ b/problems/slime/agent.ts
@@ -2,12 +2,18 @@
 // Self-contained: type imports only.
 import type { SlimeAgent } from "../../judge/slime/world";
 
-// Baseline: Jones' (2010) rule and angles: sensors at 45°, 9 cells out, turn 45° toward the strongest.
-export const params: SlimeAgent["params"] = { sensorAngle: Math.PI / 4, sensorDistance: 9, stepSize: 1, deposit: 1 };
+// Seek a trail level, not the strongest trail: agents drawn to the maximum collapse into one fat band that
+// misses most foods. Aiming for TARGET (a little above the network threshold) keeps the mass spread thin
+// along many routes, and food cells (trail 10) push agents out along straight rays that find the other foods.
+export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 8, stepSize: 1.5, deposit: 0.8 };
+
+const TARGET = 2.5, TURN = 0.5;
 
 export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
-  const ra = Math.PI / 4;
-  if (center >= left && center >= right) return 0;
-  if (center < left && center < right) return random() < 0.5 ? -ra : ra;
-  return left > right ? -ra : ra;
+  if (Math.max(left, center, right) < 0.02) return (random() - 0.5) * 0.3; // blank ground: drift straight
+  const miss = (v: number) => Math.abs(v - TARGET);
+  const l = miss(left), c = miss(center), r = miss(right);
+  if (c <= l && c <= r) return 0;
+  if (c > l && c > r) return random() < 0.5 ? -TURN : TURN;
+  return l < r ? -TURN : TURN;
 };
```
