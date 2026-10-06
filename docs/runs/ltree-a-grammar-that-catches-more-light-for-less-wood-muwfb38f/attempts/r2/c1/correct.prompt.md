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
- 1: uncertain — The diff gives no score evidence. The numbers (angle 40.15, step 54.4, shrink 0.99) look tuned, but nothing shows they beat the base on three seeded worlds. Whether `shrink` and `!` are meaningful also depends on judge code I can't see here.
- 2: uncertain — Only `problems/ltree/agent.ts` changes, which fits the path rule. Whether `shrink` is an accepted field of the grammar return type, and whether `!` is a legal symbol, can't be confirmed from the diff. If either is outside the source rules in `judge/check.ts`, this fails.

PROBLEMS:
1. problems/ltree/agent.ts: `shrink: 0.99` is a field the base grammar never set. If `LTreeAgent["grammar"]` has no `shrink` key, the check fails or the field is ignored. Confirm it exists in `judge/ltree/world`.
2. problems/ltree/agent.ts: The rule uses `!`, which the base never used. If the judge's interpreter doesn't define `!` (for example, as a width or thickness change), it is either a no-op or a rejected symbol. If it is a no-op, the comment's claim of "few thick branches" is wrong. Confirm that the alphabet allows it.
3. problems/ltree/agent.ts: `F` has no rule, so it never lengthens, and `shrink` of 0.99 barely changes anything. The comment's reasoning ("each sun finds many tips for modest wood") is unsupported. With `X` expanding to 3 children per level over 5 iterations, the tip count is 3^5 = 243. At step 54.4 that is a lot of wood, which could cost more than the light it catches. The diff has no evidence either way, so the author needs to show the score.
4. problems/ltree/agent.ts: The step is 54.4, about 12 times the base's 4.5, and the axiom changed to `FX`. Segments may extend outside the frame or world bounds. If the judge clips or penalizes that, the score drops.

## Current diff
```diff
diff --git a/problems/ltree/agent.ts b/problems/ltree/agent.ts
index ee7f939..4c94fb3 100644
--- a/problems/ltree/agent.ts
+++ b/problems/ltree/agent.ts
@@ -2,12 +2,13 @@
 // Self-contained: type imports only.
 import type { LTreeAgent } from "../../judge/ltree/world";
 
-// Baseline: Prusinkiewicz and Lindenmayer's "fractal plant" (The Algorithmic Beauty of Plants, figure 1.24f),
-// set upright on the root.
+// A bifurcating tree with a short trunk, a central continuation and almost no shrinking: few thick
+// branches fan the leaves out across the whole frame, so each sun finds many tips for modest wood.
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
