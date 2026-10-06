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
- 1: uncertain. The diff gives no evidence of a higher score. I was told not to run `judge/check.ts`, so I can't confirm it beats the base on three worlds. The new grammar has heavy wood cost: `A -> F[+A][-A]F` at 7 iterations gives about 2^7 branches, each with two `F` segments. The `step: 60` and `shrink: 0.9` values look hand-picked and untested against the judge's world bounds, wood cost and light model.
- 2: uncertain. Only `problems/ltree/agent.ts` changes, so no protected path is touched. But the diff adds a `shrink` field that the baseline never used. Nothing in the diff shows that `LTreeAgent["grammar"]` or the source rules in `judge/check.ts` allow `shrink`. If they don't, this is a type error, the field is silently ignored, or it breaks the rules.

PROBLEMS:
1. problems/ltree/agent.ts: `shrink: 0.9` is unverified against the `LTreeAgent["grammar"]` return type and the judge's source rules. Confirm the field exists and is permitted. If it doesn't, remove it and fold the length decay into the grammar, for example through `step` or the rules.
2. problems/ltree/agent.ts: the comment says the branches "spread at a narrow angle", but `angle: 25` is unchanged from the baseline. A binary fork at 25° on each side makes the crowns overlap, which shades the leaves. Either change the angle or fix the comment, and justify the choice with a score.
3. problems/ltree/agent.ts: `iterations: 7` with `step: 60` may exceed the judge's segment, length or time caps, or grow past the world bounds. That would give a zero or an invalid score on some seeded worlds. The diff doesn't show the agent staying within those limits.
4. problems/ltree/agent.ts: the baseline's `F: "FF"` thickening rule is dropped, and the trunk is now only `F` before `A`. The diff shows no reasoning that the new trunk structure catches more light for less wood.

## Current diff
```diff
diff --git a/problems/ltree/agent.ts b/problems/ltree/agent.ts
index ee7f939..c116c2a 100644
--- a/problems/ltree/agent.ts
+++ b/problems/ltree/agent.ts
@@ -2,12 +2,13 @@
 // Self-contained: type imports only.
 import type { LTreeAgent } from "../../judge/ltree/world";
 
-// Baseline: Prusinkiewicz and Lindenmayer's "fractal plant" (The Algorithmic Beauty of Plants, figure 1.24f),
-// set upright on the root.
+// A short trunk, then a binary tree: each fork keeps a trailing shoot and the branches spread at a narrow angle,
+// leaves spread wide across the sky for little wood.
 export const grammar: LTreeAgent["grammar"] = () => ({
-  axiom: "X",
-  rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
-  iterations: 5,
+  axiom: "FA",
+  rules: { A: "F[+A][-A]F" },
+  iterations: 7,
   angle: 25,
-  step: 4.5,
+  step: 60,
+  shrink: 0.9,
 });
```
