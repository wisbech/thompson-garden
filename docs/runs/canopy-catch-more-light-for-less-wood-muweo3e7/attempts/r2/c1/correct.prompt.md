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
- 1: uncertain. The diff gives no scores. The result depends on constants it never ties to the judge: `LEAF = 5` as the ray half-width, `WOOD_SCALE = 200_000`, the claim that every leaf has area 1, and the sun direction convention `(sin th, cos th)`. A wrong sign or radius would make the greedy placement optimize the wrong thing.
- 2: uncertain. Only `problems/canopy/agent.ts` changes and it imports only types, so the path rule holds. Whether the agent obeys the source rules in `judge/check.ts` can't be seen from the diff. That covers the node cap (up to 3000 nodes, assumed to be allowed), banned APIs, and any compute or time limit.

PROBLEMS:
1. problems/canopy/agent.ts: the greedy search is heavy. Each of up to 2999 iterations scans the whole grid at `STEP = 6` and runs `gain` over 3 suns with a ray loop per cell. That is roughly 10^9 operations or more on a large world, and it may exceed a judge time limit and fail the check. Bound the work, for example with a coarser grid, caching of gains, or a lazy greedy, and confirm the runtime against the limit.
2. problems/canopy/agent.ts: shading is modelled only as "this ray is already hit". The code never checks that a branch from the root to a leaf crosses other branches or leaves, so the "never cross" claim holds only because every branch starts at the root. Branches that pass through another leaf's area may still be penalized or scored as occluded by the judge. Verify against the judge's world rules.
3. problems/canopy/agent.ts: `world.root` could sit within `LEAF` of an edge or inside the grid. The `d < 1` guard and the `seen` break are the only defenses. If `best` stays positive on a cell already picked (the `seen` case), the loop ends early with no fallback. This is minor, but the early break may leave coverage on the table.

## Current diff
```diff
diff --git a/problems/canopy/agent.ts b/problems/canopy/agent.ts
index a7899db..139125f 100644
--- a/problems/canopy/agent.ts
+++ b/problems/canopy/agent.ts
@@ -2,18 +2,46 @@
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
   };
-  branch(0, 0, 150, 6);
+  const nodes: Node[] = [{ x: rx, y: ry, parent: -1 }];
+  const seen = new Set<string>();
+  for (let n = 0; n < 2999; n++) {
+    let best = 0, bx = 0, by = 0;
+    for (let x = 2; x <= world.width - 2; x += STEP) {
+      for (let y = 2; y <= world.height - 2; y += STEP) {
+        const d = Math.hypot(x - rx, y - ry);
+        if (d < 1) continue;
+        const v = gain(x, y, false) - d / WOOD_SCALE;
+        if (v > best) { best = v; bx = x; by = y; }
+      }
+    }
+    if (best <= 0 || seen.has(bx + "," + by)) break;
+    seen.add(bx + "," + by);
+    gain(bx, by, true);
+    nodes.push({ x: bx, y: by, parent: 0 });
+  }
   return nodes;
 };
```
