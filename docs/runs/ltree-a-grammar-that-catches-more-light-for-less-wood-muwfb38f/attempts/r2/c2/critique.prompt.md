# role: critique

You are the critic on card ltree-a-grammar-that-catches-more-light-for-less-wood-muwfb38f: ltree: a grammar that catches more light for less wood. Read the diff below against the task and the acceptance criteria.
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
ltree: a grammar that catches more light for less wood

## Acceptance
- problems/ltree/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts ltree --base <base>)
- only problems/ltree/ changes; the agent keeps to the source rules in judge/check.ts

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
diff --git a/problems/ltree/agent.ts b/problems/ltree/agent.ts
index ee7f939..07dd9b1 100644
--- a/problems/ltree/agent.ts
+++ b/problems/ltree/agent.ts
@@ -2,12 +2,15 @@
 // Self-contained: type imports only.
 import type { LTreeAgent } from "../../judge/ltree/world";
 
-// Baseline: Prusinkiewicz and Lindenmayer's "fractal plant" (The Algorithmic Beauty of Plants, figure 1.24f),
-// set upright on the root.
+// A bifurcating tree with one trunk, a central continuation and almost no shrinking (`!` multiplies the
+// step by `shrink`, both in the judge's alphabet). It stays inside the frame, has 81 tips against the
+// base's 256, and on seeds 1-3 scores about 0.29-0.31 (light about 0.47, wood about 35,700) where the
+// base scores about -0.03 (wood about 63,900).
 export const grammar: LTreeAgent["grammar"] = () => ({
-  axiom: "X",
-  rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
+  axiom: "FX",
+  rules: { X: "!F[+X][-X]F[X]" },
   iterations: 5,
-  angle: 25,
-  step: 4.5,
+  angle: 40.15,
+  step: 54.4,
+  shrink: 0.99,
 });
```
