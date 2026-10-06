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
  const nodes: Node[] = [{ x: rx, y: ry, parent: -1 }];
  const seen = new Set<string>();
  for (let n = 0; n < 2999; n++) {
    let best = 0, bx = 0, by = 0;
    for (let x = 2; x <= world.width - 2; x += STEP) {
      for (let y = 2; y <= world.height - 2; y += STEP) {
        const d = Math.hypot(x - rx, y - ry);
        if (d < 1) continue;
        const v = gain(x, y, false) - d / WOOD_SCALE;
        if (v > best) { best = v; bx = x; by = y; }
      }
    }
    if (best <= 0 || seen.has(bx + "," + by)) break;
    seen.add(bx + "," + by);
    gain(bx, by, true);
    nodes.push({ x: bx, y: by, parent: 0 });
  }
  return nodes;
};
