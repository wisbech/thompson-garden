# role: correct

You are the corrector on card canopy-catch-more-light-for-less-wood-muweo3e7: canopy: catch more light for less wood. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
canopy: catch more light for less wood

## Acceptance
- problems/canopy/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts canopy --base <base>)
- only problems/canopy/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
CRITERIA:
- 1: uncertain — The diff doesn't show the judge's scoring or run `judge/check.ts`. The agent's model rests on guesses it can't confirm: WOOD_SCALE=200000, LEAF=5, the sun direction convention (sin, cos), and a 3000-node cap. A wrong constant would make the greedy placement optimise the wrong objective, and the result could score below the base.
- 2: uncertain — Only `problems/canopy/agent.ts` changes and it has only a type import, so the path rule holds. The diff can't show whether it meets the source rules in `judge/check.ts`. It uses `Uint8Array`, `Math.*` and heap code. Whether those rules forbid any of that is unknown.

PROBLEMS:
1. problems/canopy/agent.ts: LEAF=5 and the 3000-node cap are hardcoded rather than read from `world`. The comment "every leaf has area 1" contradicts a leaf radius of 5. If the judge's leaf size, light model or node limit differs, light coverage is miscounted or the output is rejected. Read these values from `world` or from the judge source.
2. problems/canopy/agent.ts: Grid cells on the same ray from the root give collinear, overlapping branches, and the comment's "never cross" claim ignores this. A judge that counts overlap or touching as a crossing would reject the tree or penalise it. The first picks on a 6px grid are likely to include such collinear pairs. Skip candidates whose angle matches an already placed branch, or confirm the crossing test tolerates overlap.
3. problems/canopy/agent.ts: WOOD_SCALE=200_000 is an unexplained magic number, and nothing in the diff shows it matches the judge's wood-to-score weighting. The stop rule `v > 0` depends on it entirely. Derive it from the judge's formula, or tune it against the check and say so in a comment.
4. problems/canopy/agent.ts: Every leaf is a direct child of the root, so the agent drops the recursive branching the baseline had. If the judge penalises straight single-segment structure or rewards trunk sharing (wood shared by several leaves), the agent loses on wood. The diff gives no evidence that this tradeoff was checked.

## Current diff
```diff
diff --git a/problems/canopy/agent.ts b/problems/canopy/agent.ts
index a7899db..dc3c0fc 100644
--- a/problems/canopy/agent.ts
+++ b/problems/canopy/agent.ts
@@ -2,18 +2,64 @@
 // Self-contained: type imports only.
 import type { CanopyAgent, Node } from "../../judge/canopy/world";
 
-// Baseline, after M_5_1_01's recursive branching: a symmetric binary tree, seven levels of branches,
-// each 0.6 of its parent and 0.8 rad (about 46 degrees) to either side; narrower or longer ones cross.
+// A star of single-leaf branches from the root. Leaves are placed greedily: each new one goes where it
+// uncovers the most still-dark rays (for all three suns) minus its wood, until none pays for itself.
+// Branches that share the root never cross, and every leaf has area 1, so wood is just the lengths.
+const RAYS = 600, LEAF = 5, WOOD_SCALE = 200_000, STEP = 6;
+
 export const grow: CanopyAgent["grow"] = (world) => {
-  const nodes: Node[] = [{ x: world.root[0], y: world.root[1], parent: -1 }];
-  const branch = (parent: number, angle: number, length: number, depth: number) => {
-    const p = nodes[parent];
-    nodes.push({ x: p.x + Math.sin(angle) * length, y: p.y - Math.cos(angle) * length, parent });
-    const me = nodes.length - 1;
-    if (depth === 0) return;
-    branch(me, angle - 0.8, length * 0.6, depth - 1);
-    branch(me, angle + 0.8, length * 0.6, depth - 1);
+  const [rx, ry] = world.root;
+  const suns = world.suns.map((th) => {
+    const dx = Math.sin(th), dy = Math.cos(th), px = dy, py = -dx;
+    const proj = [[0, 0], [world.width, 0], [0, world.height], [world.width, world.height]].map(([x, y]) => x * px + y * py);
+    const lo = Math.min(...proj), hi = Math.max(...proj);
+    return { px, py, lo, step: (hi - lo) / RAYS, hit: new Uint8Array(RAYS) };
+  });
+  // rays a leaf at (x, y) would reach that are still dark, summed over suns
+  const gain = (x: number, y: number, mark: boolean) => {
+    let g = 0;
+    for (const s of suns) {
+      const off = x * s.px + y * s.py;
+      const a = Math.max(0, Math.ceil((off - LEAF - s.lo) / s.step - 0.5));
+      const b = Math.min(RAYS - 1, Math.floor((off + LEAF - s.lo) / s.step - 0.5));
+      for (let k = a; k <= b; k++) if (!s.hit[k]) { g++; if (mark) s.hit[k] = 1; }
+    }
+    return g / (RAYS * suns.length);
+  };
+  // lazy greedy: a cell's gain only falls as rays get covered, so a stale value is an upper bound and
+  // the top of the heap is the best cell as soon as its refreshed value still beats the next one
+  const cx: number[] = [], cy: number[] = [], cw: number[] = [], val: number[] = [], heap: number[] = [];
+  for (let x = 2; x <= world.width - 2; x += STEP) {
+    for (let y = 2; y <= world.height - 2; y += STEP) {
+      const d = Math.hypot(x - rx, y - ry);
+      if (d < 1) continue;
+      const v = gain(x, y, false) - d / WOOD_SCALE;
+      if (v <= 0) continue;
+      cx.push(x); cy.push(y); cw.push(d / WOOD_SCALE); val.push(v); heap.push(val.length - 1);
+    }
+  }
+  const down = (i: number) => {
+    for (;;) {
+      let m = i;
+      for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && val[heap[c]] > val[heap[m]]) m = c;
+      if (m === i) return;
+      [heap[i], heap[m]] = [heap[m], heap[i]];
+      i = m;
+    }
   };
-  branch(0, 0, 150, 6);
+  for (let i = (heap.length >> 1) - 1; i >= 0; i--) down(i);
+  const nodes: Node[] = [{ x: rx, y: ry, parent: -1 }];
+  while (nodes.length < 3000 && heap.length > 0) {
+    const t = heap[0];
+    const v = gain(cx[t], cy[t], false) - cw[t];
+    const next = Math.max(heap.length > 1 ? val[heap[1]] : -1, heap.length > 2 ? val[heap[2]] : -1);
+    if (v >= next && v > 0) {
+      gain(cx[t], cy[t], true);
+      nodes.push({ x: cx[t], y: cy[t], parent: 0 });
+      val[t] = -1;
+    } else val[t] = v;
+    if (val[t] <= 0) heap[0] = heap[heap.length - 1], heap.pop();
+    down(0);
+  }
   return nodes;
 };
```
