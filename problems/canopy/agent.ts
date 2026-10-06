// The Canopy agent: the program that grows the tree. The only file a Canopy card changes.
// Self-contained: type imports only.
import type { CanopyAgent, Node } from "../../judge/canopy/world";

// A star of single-leaf branches from the root. Leaves are placed greedily: each new one goes where it
// uncovers the most still-dark rays (for all three suns) minus its wood, until none pays for itself.
// Branches that share the root never cross, and every leaf has area 1, so wood is just the lengths.
const RAYS = 600, LEAF = 5, WOOD_SCALE = 200_000, STEP = 6;

export const grow: CanopyAgent["grow"] = (world) => {
  const [rx, ry] = world.root;
  const suns = world.suns.map((th) => {
    const dx = Math.sin(th), dy = Math.cos(th), px = dy, py = -dx;
    const proj = [[0, 0], [world.width, 0], [0, world.height], [world.width, world.height]].map(([x, y]) => x * px + y * py);
    const lo = Math.min(...proj), hi = Math.max(...proj);
    return { px, py, lo, step: (hi - lo) / RAYS, hit: new Uint8Array(RAYS) };
  });
  // rays a leaf at (x, y) would reach that are still dark, summed over suns
  const gain = (x: number, y: number, mark: boolean) => {
    let g = 0;
    for (const s of suns) {
      const off = x * s.px + y * s.py;
      const a = Math.max(0, Math.ceil((off - LEAF - s.lo) / s.step - 0.5));
      const b = Math.min(RAYS - 1, Math.floor((off + LEAF - s.lo) / s.step - 0.5));
      for (let k = a; k <= b; k++) if (!s.hit[k]) { g++; if (mark) s.hit[k] = 1; }
    }
    return g / (RAYS * suns.length);
  };
  // lazy greedy: a cell's gain only falls as rays get covered, so a stale value is an upper bound and
  // the top of the heap is the best cell as soon as its refreshed value still beats the next one
  const cx: number[] = [], cy: number[] = [], cw: number[] = [], val: number[] = [], heap: number[] = [];
  for (let x = 2; x <= world.width - 2; x += STEP) {
    for (let y = 2; y <= world.height - 2; y += STEP) {
      const d = Math.hypot(x - rx, y - ry);
      if (d < 1) continue;
      const v = gain(x, y, false) - d / WOOD_SCALE;
      if (v <= 0) continue;
      cx.push(x); cy.push(y); cw.push(d / WOOD_SCALE); val.push(v); heap.push(val.length - 1);
    }
  }
  const down = (i: number) => {
    for (;;) {
      let m = i;
      for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && val[heap[c]] > val[heap[m]]) m = c;
      if (m === i) return;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  };
  for (let i = (heap.length >> 1) - 1; i >= 0; i--) down(i);
  const nodes: Node[] = [{ x: rx, y: ry, parent: -1 }];
  while (nodes.length < 3000 && heap.length > 0) {
    const t = heap[0];
    const v = gain(cx[t], cy[t], false) - cw[t];
    const next = Math.max(heap.length > 1 ? val[heap[1]] : -1, heap.length > 2 ? val[heap[2]] : -1);
    if (v >= next && v > 0) {
      gain(cx[t], cy[t], true);
      nodes.push({ x: cx[t], y: cy[t], parent: 0 });
      v === v && (val[t] = -1);
    } else val[t] = v;
    if (val[t] <= 0) heap[0] = heap[heap.length - 1], heap.pop();
    down(0);
  }
  return nodes;
};
