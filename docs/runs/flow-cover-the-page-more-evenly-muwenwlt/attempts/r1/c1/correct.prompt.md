# role: correct

You are the corrector on card flow-cover-the-page-more-evenly-muwenwlt: flow: cover the page more evenly. Apply the critique below to the working directory: edit files
directly, fix every listed problem, and change nothing else. Do not run the project's tests. Never edit a
protected path.

## Task
flow: cover the page more evenly

## Acceptance
- problems/flow/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flow --base <base>)
- only problems/flow/ changes; the agent keeps to the source rules in judge/check.ts

## Critique
CRITERIA:
- 1: uncertain. The diff seeds beside existing trails, which should beat random starts (the notes put the idea at about 0.87 against 0.83). I can't run `judge/check.ts` here, and the diff shows no score. It also assumes that a start at `nearest >= spacing` is accepted and that `nearest` returns a distance, and nothing in the diff confirms either.
- 2: uncertain. Only `problems/flow/agent.ts` changes, so the path rule holds. The source rules in `judge/check.ts` aren't visible. The module-level `WeakMap` state keyed on the world is the most likely thing to break a "self-contained / no hidden state" rule, and the diff doesn't show whether the rules allow it.

PROBLEMS:
1. problems/flow/agent.ts: the termination bound was raised from 400 to 20000 misses. The fallback also runs up to 300 `nearest` calls per `nextSeed` call. Once the page is full, every call burns 300 probes and then returns a random point that will probably be rejected. That is up to 6M `nearest` calls per world, which risks the judge's time limit and a failed check. Keep the original 400 bound, or something close to it, and try fewer random starts.
2. problems/flow/agent.ts: `nearest(x, y) >= spacing` is used as a proxy for "the judge accepts this start", and the offset distance is `spacing * 1.0005`. If the judge's acceptance rule differs (for example, it needs a different clearance or a minimum trail length), the pre-filter wrongly drops candidates or returns ones that get rejected. The effect is either a stalled seeding pass or inflated `missesInARow`. Check this against the judge's real rule, not an assumed one.
3. problems/flow/agent.ts: the `WeakMap<FlowWorld, State>` module state assumes one world object per run and never resets. If the judge reuses a world object, or loads the module once and runs three seeded worlds through a shared object, stale cursors would skip trails. If `check.ts` forbids module state, this fails outright. Prefer deriving the cursor from the world, or confirm the rules allow it.
4. problems/flow/agent.ts: the walk does not revisit a trail's points after `trail`/`point` advance past them. Only spots that were blocked when first visited are skipped for good. Gaps that open up later, once trails are added elsewhere, are only found by the random fallback. That undercuts "cover more evenly" in the tail of the run.

## Current diff
```diff
diff --git a/problems/flow/agent.ts b/problems/flow/agent.ts
index 5e6e493..906a440 100644
--- a/problems/flow/agent.ts
+++ b/problems/flow/agent.ts
@@ -2,8 +2,33 @@
 // It must stay self-contained (type imports only), because the check also loads the base's copy alone.
 import type { FlowWorld, Point } from "../../judge/flow/world";
 
-// Baseline: start anywhere at random; stop after 400 misses in a row.
+// Seeds just beside existing trails (Jobard-Lefer): walk each accepted trail in order and offer a start
+// a little over one spacing to either side, which the judge accepts and which packs trails tightly.
+// When no trail has room left, fall back to random starts that are already known to be clear.
+interface State { trail: number; point: number; side: number }
+const states = new WeakMap<FlowWorld, State>();
+
 export function nextSeed(world: FlowWorld): Point | null {
-  if (world.missesInARow >= 400) return null;
+  let s = states.get(world);
+  if (!s) states.set(world, (s = { trail: 0, point: 0, side: 0 }));
+  const d = world.spacing * 1.0005, stride = 2;
+  while (s.trail < world.trails.length) {
+    const t = world.trails[s.trail];
+    while (s.point < t.length) {
+      const i = s.point, p = t[i], q = t[Math.min(i + 1, t.length - 1)], r = t[Math.max(i - 1, 0)];
+      const a = Math.atan2(q[1] - r[1], q[0] - r[0]) + (s.side ? -Math.PI / 2 : Math.PI / 2);
+      if (++s.side > 1) { s.side = 0; s.point += stride; }
+      const x = p[0] + d * Math.cos(a), y = p[1] + d * Math.sin(a);
+      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
+      if (world.nearest(x, y) < world.spacing) continue;
+      return [x, y];
+    }
+    s.trail++; s.point = 0; s.side = 0;
+  }
+  if (world.missesInARow >= 20000) return null;
+  for (let k = 0; k < 300; k++) {
+    const x = world.random() * world.width, y = world.random() * world.height;
+    if (world.nearest(x, y) >= world.spacing) return [x, y];
+  }
   return [world.random() * world.width, world.random() * world.height];
 }
```
