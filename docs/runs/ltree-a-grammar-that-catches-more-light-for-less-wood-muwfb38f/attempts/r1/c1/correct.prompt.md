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
- 1: uncertain. The diff swaps the fractal plant for a binary tree with `iterations: 7`, `angle: 37`, `step: 60` and `shrink: 0.94`. Nothing in it shows a higher score on three worlds. I was told not to run anything, so I can't confirm the score.
- 2: uncertain. Only `problems/ltree/agent.ts` changes, so no protected or mechanism path is touched. The source rules aren't visible in the diff, and the new grammar uses features the baseline never used.

PROBLEMS:
1. problems/ltree/agent.ts: The grammar uses `!`, a symbol the baseline never used. If `judge/ltree/world` doesn't define `!`, it is either ignored or rejected. In that case the middle shoot and the "keeps a short middle shoot" claim in the comment do not hold. Check that `!` is a supported turtle symbol and what it does.
2. problems/ltree/agent.ts: It adds a `shrink` field the baseline never returned. Confirm that `LTreeAgent["grammar"]` includes an optional `shrink` and that the judge honours it. If the type lacks it, this is a type error or a silently ignored value.
3. problems/ltree/agent.ts: `step` goes from 4.5 to 60, and `iterations` from 5 to 7. With branching `A` expanding to two `A`s per iteration, the output is about 128 tips. Check this against any cap in `judge/check.ts` on symbol count, total wood, segment length or world bounds. A violation would be rejected as breaking the source rules. The extra reach could also push branches off the world or into the ground.
4. problems/ltree/agent.ts: The claim of "more light for less wood" is untested. Branches shrink only slowly (0.94) and the tips fan out to ±37° with no other control, so self-shading and wood cost could well beat the baseline's gain. The diff gives no evidence on any seeded world, and a single fixed grammar may not generalise across the three worlds.

## Current diff
```diff
diff --git a/problems/ltree/agent.ts b/problems/ltree/agent.ts
index ee7f939..d5df2dd 100644
--- a/problems/ltree/agent.ts
+++ b/problems/ltree/agent.ts
@@ -2,12 +2,13 @@
 // Self-contained: type imports only.
 import type { LTreeAgent } from "../../judge/ltree/world";
 
-// Baseline: Prusinkiewicz and Lindenmayer's "fractal plant" (The Algorithmic Beauty of Plants, figure 1.24f),
-// set upright on the root.
+// A short trunk, then a binary tree whose branches shrink slowly and each fork keeps a short middle shoot:
+// leaves spread wide across the sky for little wood.
 export const grammar: LTreeAgent["grammar"] = () => ({
-  axiom: "X",
-  rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
-  iterations: 5,
-  angle: 25,
-  step: 4.5,
+  axiom: "FA",
+  rules: { A: "!F[+A][-A]!!F" },
+  iterations: 7,
+  angle: 37,
+  step: 60,
+  shrink: 0.94,
 });
```
