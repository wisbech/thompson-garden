// The L-tree world, owned by the judge: a Lindenmayer system (Prusinkiewicz and Lindenmayer, The
// Algorithmic Beauty of Plants, 1990). The worker writes only the grammar; the judge rewrites the
// string, walks the turtle, builds the tree, gives it pipe-model thickness and casts the light.
//
// Learned from Canopy, whose measure a fan of grass blades beat: here the root has exactly one
// child (a trunk, so every leaf pays for the wood beneath it), and leaves in the shaded understory
// (lower than SHADE px above the ground) catch nothing.
import { INK, ACCENT, PAPER, prng } from "../lib";

export const WIDTH = 800, HEIGHT = 600;
export const ROOT: [number, number] = [400, 600];
export const MAX_ITERATIONS = 7, MAX_SYMBOLS = 400_000, MAX_SEGMENTS = 6000;
export const LEAF = 5, RAYS = 600, SHADE = 120, WOOD_SCALE = 200_000;

// F and G: draw forward one step. f: move forward without drawing (starts a new branch point).
// + and -: turn by the angle. [ and ]: push and pop the turtle. !: multiply the step by `shrink`.
// Every other symbol only rewrites.
export interface Grammar {
  axiom: string;
  rules: Record<string, string>;   // one replacement per symbol
  iterations: number;              // at most MAX_ITERATIONS
  angle: number;                   // degrees
  step: number;                    // px, at most 60
  shrink?: number;                 // for !, between 0.3 and 1 (default 0.7)
}
export interface LTreeAgent { grammar(world: { width: number; height: number; suns: number[] }): Grammar }

export function sunsFor(seed: number): number[] {
  const r = prng(seed ^ 0x5a1);
  return [-1, 0, 1].map((k) => (k * 0.45 + (r() - 0.5) * 0.3));
}

export function rewrite(g: Grammar): string {
  let s = String(g.axiom ?? "");
  const n = Math.max(0, Math.min(MAX_ITERATIONS, Math.floor(+g.iterations || 0)));
  for (let i = 0; i < n; i++) {
    let out = "";
    for (const c of s) {
      out += Object.prototype.hasOwnProperty.call(g.rules ?? {}, c) ? String(g.rules[c]) : c;
      if (out.length > MAX_SYMBOLS) throw new Error(`the string passes ${MAX_SYMBOLS} symbols`);
    }
    s = out;
  }
  return s;
}

export interface Node { x: number; y: number; parent: number }

// The turtle starts at the root heading straight up. Consecutive draws extend one branch; a node is
// made at every draw. Order of nodes = order of drawing, which is also the order the page animates.
export function walk(g: Grammar, symbols: string): Node[] {
  const turn = (+g.angle || 0) * Math.PI / 180, shrink = Math.max(0.3, Math.min(1, g.shrink ?? 0.7));
  let step = Math.max(0.5, Math.min(60, +g.step || 0));
  const nodes: Node[] = [{ x: ROOT[0], y: ROOT[1], parent: -1 }];
  let at = 0, x = ROOT[0], y = ROOT[1], h = 0, penUp = false;
  const stack: [number, number, number, number, number, boolean][] = [];
  for (const c of symbols) {
    if (c === "F" || c === "G") {
      x += Math.sin(h) * step; y -= Math.cos(h) * step;
      if (penUp) throw new Error("drawing after f would float a branch in the air");
      nodes.push({ x, y, parent: at }); at = nodes.length - 1;
      if (nodes.length > MAX_SEGMENTS + 1) throw new Error(`more than ${MAX_SEGMENTS} segments`);
    } else if (c === "f") { x += Math.sin(h) * step; y -= Math.cos(h) * step; penUp = true; }
    else if (c === "+") h += turn;
    else if (c === "-") h -= turn;
    else if (c === "!") step *= shrink;
    else if (c === "[") stack.push([at, x, y, h, step, penUp]);
    else if (c === "]") { const s = stack.pop(); if (!s) throw new Error("] without ["); [at, x, y, h, step, penUp] = s; }
  }
  return nodes;
}

export interface LTreeResult { score: number; valid: boolean; reason: string; light: number; wood: number; leaves: number; nodes: Node[]; area: number[]; suns: number[]; symbols: number }

export function measure(nodes: Node[], suns: number[], symbols = 0): LTreeResult {
  const bad = (reason: string): LTreeResult => ({ score: -1, valid: false, reason, light: 0, wood: 0, leaves: 0, nodes, area: [], suns, symbols });
  if (nodes.length < 2) return bad("the tree draws nothing");
  for (const n of nodes) if (!(n.x >= 0 && n.x <= WIDTH && n.y >= 0 && n.y <= HEIGHT)) return bad("a branch leaves the frame");
  const kids = new Array(nodes.length).fill(0), area = new Array(nodes.length).fill(0);
  for (let i = 1; i < nodes.length; i++) kids[nodes[i].parent]++;
  if (kids[0] !== 1) return bad("the root needs exactly one trunk");
  for (let i = nodes.length - 1; i >= 1; i--) { if (kids[i] === 0) area[i] = 1; area[nodes[i].parent] += area[i]; }
  let wood = 0;
  for (let i = 1; i < nodes.length; i++) { const p = nodes[nodes[i].parent]; wood += Math.hypot(nodes[i].x - p.x, nodes[i].y - p.y) * area[i]; }
  const tips = nodes.filter((_, i) => i > 0 && kids[i] === 0);
  const lit = tips.filter((l) => l.y <= ROOT[1] - SHADE);
  let light = 0;
  for (const th of suns) {
    const dx = Math.sin(th), dy = Math.cos(th), px = dy, py = -dx;
    const proj = [[0, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH, HEIGHT]].map(([x, y]) => x * px + y * py);
    const lo = Math.min(...proj), hi = Math.max(...proj);
    const offs = lit.map((l) => l.x * px + l.y * py).sort((a, b) => a - b);
    let hit = 0;
    for (let k = 0; k < RAYS; k++) {
      const c = lo + (k + 0.5) / RAYS * (hi - lo);
      let a = 0, b = offs.length;
      while (a < b) { const m = (a + b) >> 1; if (offs[m] < c - LEAF) a = m + 1; else b = m; }
      if (a < offs.length && offs[a] <= c + LEAF) hit++;
    }
    light += hit / RAYS / suns.length;
  }
  return { score: light - wood / WOOD_SCALE, valid: true, reason: "", light, wood, leaves: tips.length, nodes, area, suns, symbols };
}

// Score = light - wood / 200,000: the mean share of parallel rays from three suns that hit a leaf
// above the understory, minus branch length x pipe-model area. An invalid tree scores -1.
export function run(agent: LTreeAgent, seed: number, _budgetMs: number): LTreeResult {
  const suns = sunsFor(seed);
  try {
    const g = agent.grammar({ width: WIDTH, height: HEIGHT, suns: [...suns] });
    const s = rewrite(g);
    return measure(walk(g, s), suns, s.length);
  } catch (e) {
    return { score: -1, valid: false, reason: String(e instanceof Error ? e.message : e), light: 0, wood: 0, leaves: 0, nodes: [], area: [], suns, symbols: 0 };
  }
}

export function picture(r: LTreeResult): string {
  const N = r.nodes;
  const segs = r.valid ? N.slice(1).map((n, k) => { const p = N[n.parent]; return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" stroke-width="${Math.max(0.5, Math.sqrt(r.area[k + 1]) * 0.6).toFixed(2)}"/>`; }).join("") : "";
  const kids = new Set(N.map((n) => n.parent));
  const leaves = r.valid ? N.map((n, i) => (i > 0 && !kids.has(i) ? `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${LEAF}"/>` : "")).join("") : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}"><rect width="100%" height="100%" fill="${PAPER}"/><rect x="0" y="${HEIGHT - SHADE}" width="${WIDTH}" height="${SHADE}" fill="${ACCENT}" fill-opacity="0.06"/><g stroke="${INK}" stroke-linecap="round">${segs}</g><g fill="${INK}" fill-opacity="0.3">${leaves}</g></svg>\n`;
}
