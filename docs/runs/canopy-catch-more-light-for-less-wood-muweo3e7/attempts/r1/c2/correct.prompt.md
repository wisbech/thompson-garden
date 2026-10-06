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
- 1: uncertain. The diff includes a baseline-equivalent shape (kids 2, spread 1.6, ratio 0.6, len 150, depth 6). The final `score(...) > bestScore ? a : best` keeps the better of the search and the baseline, so it should never score below the base on the agent's own score. Whether it scores strictly higher on the judge's three seeded worlds depends on `score()` matching the judge's scorer, and nothing in the diff shows that it does.
- 2: uncertain. Only `problems/canopy/agent.ts` changes, so no protected or mechanism path is touched. The file imports only types, which fits the "self-contained" header. I can't see `judge/check.ts`, so I can't confirm the source rules (banned identifiers, size or time limits, allowed use of `world.random`) are met.

PROBLEMS:
1. problems/canopy/agent.ts (`score`): This is a hand-copied version of the judge's scorer. The details are guessed, not derived from the diff or the judge: the 5 px leaf width, 600 samples, `wood / 200_000`, wood weighted by leaf count below each segment, and the leaf definition. If any of them differs from `judge/world`, the greedy and shape search optimise the wrong objective. The result can then score below the base on the real judge, while the self-comparison against `bestScore` still looks safe. Import or reuse the judge's scorer if the rules allow it. Otherwise, justify each constant against the judge source.
2. problems/canopy/agent.ts (`greedy`): The crossing test only detects strict proper crossings. A new segment that touches or passes within the judge's tolerance of another node or segment is accepted. The `trusted` path also skips the bounds and full crossing re-check. If the judge uses a minimum-distance or touching rule, the greedy output becomes invalid (score -1). The final `score(world, a)` call runs untrusted, so it would reject the whole greedy tree and fall back to `best`. That discards all of the greedy work silently, and the criterion may then pass only on the shape search.
3. problems/canopy/agent.ts (`greedy`): The loop runs 1500 tries with up to 4 candidates each. Each candidate costs a full `score` (a leaf sort plus 600 samples per sun) plus an O(n) crossing scan. That is roughly 6000 full scorings on trees of hundreds of nodes. If the judge has a per-world time limit, which `judge/check.ts` may enforce, this could time out. The diff gives no evidence either way. Cap the work, or score incrementally.
4. problems/canopy/agent.ts (`greedy`): The node cap is enforced with `nodes.length >= 2999`. This is inconsistent with the `n > 3000` limit in `score`, and the judge's exact limit is not verified here. Check the limit against the judge.

## Current diff
```diff
diff --git a/problems/canopy/agent.ts b/problems/canopy/agent.ts
index a7899db..2e22733 100644
--- a/problems/canopy/agent.ts
+++ b/problems/canopy/agent.ts
@@ -2,18 +2,145 @@
 // Self-contained: type imports only.
 import type { CanopyAgent, Node } from "../../judge/canopy/world";
 
-// Baseline, after M_5_1_01's recursive branching: a symmetric binary tree, seven levels of branches,
-// each 0.6 of its parent and 0.8 rad (about 46 degrees) to either side; narrower or longer ones cross.
-export const grow: CanopyAgent["grow"] = (world) => {
+type World = Parameters<CanopyAgent["grow"]>[0];
+interface Shape { kids: number; spread: number; ratio: number; len: number; depth: number; bend: number }
+interface Fish { len: number; segs: number; ratio: number; angle: number; depth: number }
+
+// Recursive branching after M_5_1: `kids` children fanned over `spread` rad around the parent's heading,
+// each `ratio` of its parent's length, optionally bent toward the vertical by `bend`.
+function build(world: World, s: Shape): Node[] {
   const nodes: Node[] = [{ x: world.root[0], y: world.root[1], parent: -1 }];
   const branch = (parent: number, angle: number, length: number, depth: number) => {
     const p = nodes[parent];
     nodes.push({ x: p.x + Math.sin(angle) * length, y: p.y - Math.cos(angle) * length, parent });
     const me = nodes.length - 1;
     if (depth === 0) return;
-    branch(me, angle - 0.8, length * 0.6, depth - 1);
-    branch(me, angle + 0.8, length * 0.6, depth - 1);
+    for (let k = 0; k < s.kids; k++) {
+      const off = s.kids === 1 ? 0 : (k / (s.kids - 1) - 0.5) * s.spread;
+      branch(me, (angle + off) * (1 - s.bend), length * s.ratio, depth - 1);
+    }
+  };
+  branch(0, 0, s.len, s.depth);
+  return nodes;
+}
+
+// Fishbone growth: each branch is a chain of `segs` segments with a side shoot off each joint, left and right.
+function fishbone(world: World, f: Fish): Node[] {
+  const nodes: Node[] = [{ x: world.root[0], y: world.root[1], parent: -1 }];
+  const branch = (parent: number, angle: number, length: number, depth: number) => {
+    let at = parent;
+    const step = length / f.segs;
+    for (let i = 0; i < f.segs; i++) {
+      const p = nodes[at];
+      nodes.push({ x: p.x + Math.sin(angle) * step, y: p.y - Math.cos(angle) * step, parent: at });
+      at = nodes.length - 1;
+      if (depth > 0 && i >= 1) {
+        const l = length * f.ratio * (1 - i / (f.segs + 1));
+        branch(at, angle - f.angle, l, depth - 1);
+        branch(at, angle + f.angle, l, depth - 1);
+      }
+    }
   };
-  branch(0, 0, 150, 6);
+  branch(0, 0, f.len, f.depth);
   return nodes;
+}
+
+const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) => {
+  const o = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
+  const d1 = o(ax, ay, bx, by, cx, cy), d2 = o(ax, ay, bx, by, dx, dy), d3 = o(cx, cy, dx, dy, ax, ay), d4 = o(cx, cy, dx, dy, bx, by);
+  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
+};
+
+// The judge's own score, restated here so shapes can be compared; -1 when the tree is not valid.
+function score(world: World, nodes: Node[], trusted = false): number {
+  const n = nodes.length;
+  if (n > 3000) return -1;
+  if (!trusted) for (let i = 1; i < n; i++) {
+    const q = nodes[i];
+    if (q.x < 0 || q.x > world.width || q.y < 0 || q.y > world.height) return -1;
+  }
+  if (!trusted) for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) {
+    const a = nodes[i].parent, b = nodes[j].parent;
+    if (a === b || a === j || b === i) continue;
+    if (cross(nodes[a].x, nodes[a].y, nodes[i].x, nodes[i].y, nodes[b].x, nodes[b].y, nodes[j].x, nodes[j].y)) return -1;
+  }
+  const kids = new Array(n).fill(0), area = new Array(n).fill(0);
+  for (let i = 1; i < n; i++) kids[nodes[i].parent]++;
+  for (let i = n - 1; i >= 1; i--) { if (kids[i] === 0) area[i] = 1; area[nodes[i].parent] += area[i]; }
+  let wood = 0;
+  for (let i = 1; i < n; i++) { const p = nodes[nodes[i].parent]; wood += Math.hypot(nodes[i].x - p.x, nodes[i].y - p.y) * area[i]; }
+  const leaves = nodes.filter((_, i) => i > 0 && kids[i] === 0);
+  let light = 0;
+  for (const th of world.suns) {
+    const dx = Math.sin(th), dy = Math.cos(th), px = dy, py = -dx;
+    const proj = [[0, 0], [world.width, 0], [0, world.height], [world.width, world.height]].map(([x, y]) => x * px + y * py);
+    const lo = Math.min(...proj), hi = Math.max(...proj);
+    const offs = leaves.map((l) => l.x * px + l.y * py).sort((u, v) => u - v);
+    let hit = 0;
+    for (let k = 0; k < 600; k++) {
+      const c = lo + (k + 0.5) / 600 * (hi - lo);
+      let l = 0, h = offs.length;
+      while (l < h) { const m = (l + h) >> 1; if (offs[m] < c - 5) l = m + 1; else h = m; }
+      if (l < offs.length && offs[l] <= c + 5) hit++;
+    }
+    light += hit / 600 / world.suns.length;
+  }
+  return light - wood / 200_000;
+}
+
+// Greedy growth: try random points, hang each from one of its nearest nodes, keep it when the score rises.
+function greedy(world: World, start: Node[], tries: number): Node[] {
+  const nodes = start.map((n) => ({ ...n }));
+  const sk = (n: Node[]) => score(world, n, true);
+  let cur = sk(nodes);
+  for (let t = 0; t < tries; t++) {
+    const x = 5 + world.random() * (world.width - 10), y = 5 + world.random() * (world.height - 30);
+    const all = nodes.map((n, i) => ({ i, d: Math.hypot(n.x - x, n.y - y) })).sort((a, b) => a.d - b.d);
+    if (all[0].d < 3) continue;  // never land on or beside an existing node
+    const near = all.slice(0, 4);
+    let bestI = -1, bestV = cur;
+    for (const { i } of near) {
+      if (nodes.length >= 2999) continue;
+      const p = nodes[i];
+      let bad = false;
+      for (let j = 1; j < nodes.length && !bad; j++) {
+        const a = nodes[j].parent;
+        if (a === i || j === i) continue;
+        bad = cross(p.x, p.y, x, y, nodes[a].x, nodes[a].y, nodes[j].x, nodes[j].y);
+      }
+      if (bad) continue;
+      nodes.push({ x, y, parent: i });
+      const v = sk(nodes);
+      nodes.pop();
+      if (v > bestV) { bestV = v; bestI = i; }
+    }
+    if (bestI >= 0) { nodes.push({ x, y, parent: bestI }); cur = bestV; }
+  }
+  return nodes;
+}
+
+// Search a small family of shapes, then let the greedy pass grow from the best of them.
+export const grow: CanopyAgent["grow"] = (world) => {
+  let best = build(world, { kids: 2, spread: 1.6, ratio: 0.6, len: 150, depth: 6, bend: 0 });
+  let bestScore = score(world, best);
+  for (const kids of [2, 3]) {
+    const depths = kids === 2 ? [6, 7] : [4, 5];
+    for (const depth of depths) for (const len of [120, 180]) for (const ratio of [0.6, 0.75])
+      for (const spread of [1.2, 1.6, 2.0]) for (const bend of [0, 0.1]) {
+        const s = { kids, spread, ratio, len, depth, bend };
+        const t = build(world, s);
+        if (t.length > 700) continue;
+        const v = score(world, t);
+        if (v > bestScore) { best = t; bestScore = v; }
+      }
+  }
+  for (const depth of [1, 2, 3]) for (const segs of [3, 5]) for (const len of [300, 500])
+    for (const ratio of [0.4, 0.7]) for (const angle of [0.6, 1.0]) {
+      const t = fishbone(world, { len, segs, ratio, angle, depth });
+      if (t.length > 1200) continue;
+      const v = score(world, t);
+      if (v > bestScore) { best = t; bestScore = v; }
+    }
+  const a = greedy(world, best, 1500);
+  return score(world, a) > bestScore ? a : best;
 };
```
