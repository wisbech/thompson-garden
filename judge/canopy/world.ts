// The Canopy world, owned by the judge: a tree grown from a root at the bottom of the frame must catch
// light from three suns for as little wood as it can, after Generative Design M_5_1 (recursion) and
// the trade-off real trees solve. The worker writes the growth program; the judge validates the tree,
// gives it pipe-model thickness, casts the light and weighs the wood.
import { crosses, INK, ACCENT, PAPER, prng } from "../lib";

export const WIDTH = 800, HEIGHT = 600;
export const ROOT: [number, number] = [400, 600];
export const MAX_NODES = 3000;
export const LEAF = 5;                    // every tip carries a leaf disc of this radius
export const RAYS = 600;                  // per sun
export const WOOD_SCALE = 200_000;        // wood that costs one unit of light

export interface Node { x: number; y: number; parent: number }
export interface CanopyAgent {
  // node 0 must be the root, at ROOT, with parent -1; every other node's parent comes before it
  grow(world: { width: number; height: number; root: [number, number]; suns: number[]; random(): number }): Node[];
}

export function sunsFor(seed: number): number[] {
  const r = prng(seed ^ 0x5a1);
  return [-1, 0, 1].map((k) => (k * 0.45 + (r() - 0.5) * 0.3));    // radians from straight overhead
}

export interface CanopyResult { score: number; valid: boolean; reason: string; light: number; wood: number; leaves: number; nodes: Node[]; area: number[]; suns: number[] }

export function validate(nodes: Node[]): string {
  if (!Array.isArray(nodes) || nodes.length < 2) return "fewer than two nodes";
  if (nodes.length > MAX_NODES) return `more than ${MAX_NODES} nodes`;
  const r = nodes[0];
  if (r.parent !== -1 || Math.abs(r.x - ROOT[0]) > 1e-6 || Math.abs(r.y - ROOT[1]) > 1e-6) return "node 0 is not the root";
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i];
    if (!Number.isInteger(n.parent) || n.parent < 0 || n.parent >= i) return `node ${i} has a bad parent`;
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y) || n.x < 0 || n.x > WIDTH || n.y < 0 || n.y > HEIGHT) return `node ${i} is outside the frame`;
    const p = nodes[n.parent];
    if (Math.hypot(n.x - p.x, n.y - p.y) < 0.5) return `node ${i} sits on its parent`;
  }
  // no two segments that share no node may cross
  const seg = nodes.slice(1).map((n, k) => ({ a: n.parent, b: k + 1 }));
  const box = seg.map(({ a, b }) => [Math.min(nodes[a].x, nodes[b].x), Math.max(nodes[a].x, nodes[b].x), Math.min(nodes[a].y, nodes[b].y), Math.max(nodes[a].y, nodes[b].y)]);
  for (let i = 0; i < seg.length; i++) for (let j = i + 1; j < seg.length; j++) {
    const s = seg[i], t = seg[j];
    if (s.a === t.a || s.a === t.b || s.b === t.a || s.b === t.b) continue;
    const A = box[i], B = box[j];
    if (A[1] < B[0] || B[1] < A[0] || A[3] < B[2] || B[3] < A[2]) continue;
    if (crosses(nodes[s.a].x, nodes[s.a].y, nodes[s.b].x, nodes[s.b].y, nodes[t.a].x, nodes[t.a].y, nodes[t.b].x, nodes[t.b].y)) return `segments ${i + 1} and ${j + 1} cross`;
  }
  return "";
}

// Pipe model: a tip's branch has area 1; a parent's is the sum of its children's.
// Wood = sum over segments of length x area. Light = mean over the suns of the share of parallel rays
// across the frame that hit a leaf. Score = light - wood / WOOD_SCALE; an invalid tree scores -1.
export function measure(nodes: Node[], suns: number[]): CanopyResult {
  const reason = validate(nodes);
  if (reason) return { score: -1, valid: false, reason, light: 0, wood: 0, leaves: 0, nodes: Array.isArray(nodes) ? nodes : [], area: [], suns };
  const kids = new Array(nodes.length).fill(0), area = new Array(nodes.length).fill(0);
  for (let i = 1; i < nodes.length; i++) kids[nodes[i].parent]++;
  for (let i = nodes.length - 1; i >= 1; i--) { if (kids[i] === 0) area[i] = 1; area[nodes[i].parent] += area[i]; }
  let wood = 0;
  for (let i = 1; i < nodes.length; i++) { const p = nodes[nodes[i].parent]; wood += Math.hypot(nodes[i].x - p.x, nodes[i].y - p.y) * area[i]; }
  const leaves = nodes.filter((_, i) => i > 0 && kids[i] === 0);
  let light = 0;
  for (const th of suns) {
    const dx = Math.sin(th), dy = Math.cos(th);           // light travels down and sideways
    const px = dy, py = -dx;                              // across the rays
    const proj = [[0, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH, HEIGHT]].map(([x, y]) => x * px + y * py);
    const lo = Math.min(...proj), hi = Math.max(...proj);
    const offs = leaves.map((l) => l.x * px + l.y * py).sort((a, b) => a - b);
    let hit = 0;
    for (let k = 0; k < RAYS; k++) {
      const c = lo + (k + 0.5) / RAYS * (hi - lo);
      let lo2 = 0, hi2 = offs.length;                     // any leaf within LEAF of this ray's line?
      while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (offs[m] < c - LEAF) lo2 = m + 1; else hi2 = m; }
      if (lo2 < offs.length && offs[lo2] <= c + LEAF) hit++;
    }
    light += hit / RAYS / suns.length;
  }
  return { score: light - wood / WOOD_SCALE, valid: true, reason: "", light, wood, leaves: leaves.length, nodes, area, suns };
}

export function run(agent: CanopyAgent, seed: number, _budgetMs: number): CanopyResult {
  const suns = sunsFor(seed);
  let nodes: Node[];
  try { nodes = agent.grow({ width: WIDTH, height: HEIGHT, root: [...ROOT] as [number, number], suns: [...suns], random: prng(seed ^ 0x7ee) }); }
  catch (e) { return { score: -1, valid: false, reason: `grow threw: ${e}`, light: 0, wood: 0, leaves: 0, nodes: [], area: [], suns }; }
  return measure(nodes, suns);
}

export function picture(r: CanopyResult): string {
  const N = r.nodes;
  const segs = r.valid ? N.slice(1).map((n, k) => { const p = N[n.parent]; return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" stroke-width="${Math.max(0.6, Math.sqrt(r.area[k + 1]) * 0.9).toFixed(2)}"/>`; }).join("") : "";
  const kids = new Set(N.map((n) => n.parent));
  const leaves = r.valid ? N.map((n, i) => (i > 0 && !kids.has(i) ? `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${LEAF}"/>` : "")).join("") : "";
  const sun = r.suns.map((th) => `<line x1="${(400 - Math.sin(th) * 700).toFixed(0)}" y1="${(300 - Math.cos(th) * 700).toFixed(0)}" x2="400" y2="300"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}"><rect width="100%" height="100%" fill="${PAPER}"/><g stroke="${ACCENT}" stroke-opacity="0.25" stroke-dasharray="3 6">${sun}</g><g stroke="${INK}" stroke-linecap="round">${segs}</g><g fill="${INK}" fill-opacity="0.35">${leaves}</g></svg>\n`;
}
