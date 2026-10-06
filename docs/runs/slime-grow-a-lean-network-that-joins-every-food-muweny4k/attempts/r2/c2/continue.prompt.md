# role: continue

You are the worker on card slime-grow-a-lean-network-that-joins-every-food-muweny4k: slime: grow a lean network that joins every food.

The working directory holds your previous attempt; its diff against the base is below. Extend or rewrite it so
that every acceptance criterion holds. Edit files directly. Do not run the project's tests. Never edit a
protected path.

## Task
slime: grow a lean network that joins every food

## Acceptance
- problems/slime/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts slime --base <base>)
- only problems/slime/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The slime problem: read problems/slime/README.md and judge/slime/world.ts (the world, protected) first. Change only problems/slime/agent.ts. Baseline 0.0222 on fixed seeds; bun judge/check.ts slime --score prints the current score and bun judge/check.ts slime --picture /tmp/slime draws it.

## Score (higher is better)
The project's own measure, 1.230212 at the base (command: bun judge/check.ts all --score; higher is better). Within the acceptance criteria, the bigger the rise the better; a change
that passes the check by the smallest possible margin is a weak result.

## Protected paths (never edit)
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

## Current diff
```diff
diff --git a/problems/slime/agent.ts b/problems/slime/agent.ts
index 8b5bc50..98aa5f4 100644
--- a/problems/slime/agent.ts
+++ b/problems/slime/agent.ts
@@ -2,12 +2,18 @@
 // Self-contained: type imports only.
 import type { SlimeAgent } from "../../judge/slime/world";
 
-// Baseline: Jones' (2010) rule and angles: sensors at 45°, 9 cells out, turn 45° toward the strongest.
-export const params: SlimeAgent["params"] = { sensorAngle: Math.PI / 4, sensorDistance: 9, stepSize: 1, deposit: 1 };
+// Climb toward a trail level, not toward the strongest trail: attraction saturates at TARGET (a little above the
+// network threshold), so a thick band is no better than a thin one and agents stop piling into one fat route.
+// Anything at or above TARGET, food included, still attracts fully; only the surplus is ignored.
+export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 8, stepSize: 1.5, deposit: 0.8 };
+
+const TARGET = 2.5, TURN = 0.5;
 
 export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
-  const ra = Math.PI / 4;
-  if (center >= left && center >= right) return 0;
-  if (center < left && center < right) return random() < 0.5 ? -ra : ra;
-  return left > right ? -ra : ra;
+  if (Math.max(left, center, right) < 0.02) return (random() - 0.5) * 0.3; // blank ground: drift (the world reflects walls)
+  const pull = (v: number) => Math.min(v, TARGET) + 0.01 * v;
+  const l = pull(left), c = pull(center), r = pull(right);
+  if (c >= l && c >= r) return (random() - 0.5) * 0.1; // aligned: small jitter so parallel lines do not lock
+  if (c < l && c < r) return random() < 0.5 ? -TURN : TURN;
+  return l > r ? -TURN : TURN;
 };
```
