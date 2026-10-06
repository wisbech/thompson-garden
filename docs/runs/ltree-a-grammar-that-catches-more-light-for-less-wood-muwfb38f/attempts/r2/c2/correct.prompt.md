# role: correct

You are the corrector on card ltree-a-grammar-that-catches-more-light-for-less-wood-muwfb38f: ltree: a grammar that catches more light for less wood. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
ltree: a grammar that catches more light for less wood

## Acceptance
- problems/ltree/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts ltree --base <base>)
- only problems/ltree/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
CRITERIA:
- 1: uncertain. The diff only claims scores in a comment (about 0.29-0.31 against about -0.03 for the base, on "seeds 1-3"). I can't run the judge, and the comment doesn't say these are the commit-seeded worlds. Nothing in the diff proves the improvement.
- 2: uncertain. Only `problems/ltree/agent.ts` changes, so the path rule holds. Whether the source rules in `judge/check.ts` allow the `!` symbol, the `shrink` field and the unusual `step`/`angle` values can't be seen from the diff.

PROBLEMS:
1. problems/ltree/agent.ts: The new comment gives measured scores (light about 0.47, wood about 35,700, 81 tips) and a seed range that the diff can't back up. Check each figure against `bun judge/check.ts ltree --base <base>` on the commit-seeded worlds. Otherwise drop the numbers, since a stale or wrong claim in a comment misleads later cards.
2. problems/ltree/agent.ts: `step: 54.4` and `angle: 40.15` look tuned to the specific seeds. They may score well on seeds 1-3 and not on other seeds. Confirm the agent also beats the base on the three worlds the judge actually seeds from the commit.
3. problems/ltree/agent.ts: `shrink: 0.99` is a near-no-op, so `!` barely changes the step. The comment calls this "almost no shrinking", but the rule still pays for a `!` in every expansion. Confirm `shrink` is a valid optional field of `LTreeAgent["grammar"]`, or the type check will fail.

## Current diff
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
