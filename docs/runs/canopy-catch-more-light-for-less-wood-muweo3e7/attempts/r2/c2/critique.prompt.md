# role: critique

You are the critic on card canopy-catch-more-light-for-less-wood-muweo3e7: canopy: catch more light for less wood. Read the diff below against the task and the acceptance criteria.
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
canopy: catch more light for less wood

## Acceptance
- problems/canopy/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts canopy --base <base>)
- only problems/canopy/ changes; the agent keeps to the source rules in judge/check.ts

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
