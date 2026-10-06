// The Web world, owned by the judge: a graph to untangle by force, after Generative Design M_6_1
// (nodes that repel, springs that pull). The judge makes the graph, places the nodes at random,
// limits how far a node may move per step and keeps it in the frame; the worker writes only the
// forces. The graph is a 7 x 7 grid with some edges removed and the nodes shuffled, so a layout
// with no crossings is known to exist.
import { crosses, INK, ACCENT, PAPER, prng } from "../lib";

export const WIDTH = 800, HEIGHT = 600, MARGIN = 10;
export const SIDE = 7;
export const STEPS = 600;
export const MAX_MOVE = 8;              // px per node per step
export const RADIUS = 8;                // two nodes closer than 2 * RADIUS overlap

export type Edge = [number, number];
export interface WebContext {
  readonly n: number;
  readonly edges: readonly Edge[];
  readonly step: number;
  readonly steps: number;
  readonly width: number;
  readonly height: number;
  random(): number;                      // seeded; use this, not Math.random
  memory: Record<string, unknown>;       // yours, kept for one run (velocities and the like)
}
export interface WebAgent {
  // positions as [x0, y0, x1, y1, ...]; return the wanted move per node in the same layout
  forces(positions: Float64Array, ctx: WebContext): ArrayLike<number>;
}

export function graphFor(seed: number): { n: number; edges: Edge[] } {
  const r = prng(seed ^ 0x77), n = SIDE * SIDE;
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const all: Edge[] = [];
  for (let y = 0; y < SIDE; y++) for (let x = 0; x < SIDE; x++) {
    if (x + 1 < SIDE) all.push([y * SIDE + x, y * SIDE + x + 1]);
    if (y + 1 < SIDE) all.push([y * SIDE + x, (y + 1) * SIDE + x]);
  }
  // drop about 15% of edges, never disconnecting the graph
  const edges = [...all];
  for (const e of all) {
    if (r() > 0.15) continue;
    const rest = edges.filter((f) => f !== e);
    if (connected(n, rest)) edges.splice(edges.indexOf(e), 1);
  }
  return { n, edges: edges.map(([a, b]) => [perm[a], perm[b]] as Edge) };
}

function connected(n: number, edges: Edge[]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Set([0]), stack = [0];
  while (stack.length) for (const m of adj[stack.pop()!]) if (!seen.has(m)) { seen.add(m); stack.push(m); }
  return seen.size === n;
}

export interface WebResult { score: number; crossings: number; overlaps: number; evenness: number; positions: Float64Array; edges: Edge[] }

export function run(agent: WebAgent, seed: number, budgetMs: number): WebResult {
  const { n, edges } = graphFor(seed), random = prng(seed ^ 0x1234);
  const pos = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) { pos[2 * i] = MARGIN + random() * (WIDTH - 2 * MARGIN); pos[2 * i + 1] = MARGIN + random() * (HEIGHT - 2 * MARGIN); }
  const memory: Record<string, unknown> = {};
  const start = performance.now();
  for (let step = 0; step < STEPS; step++) {
    if (performance.now() - start > budgetMs) break;
    const f = agent.forces(Float64Array.from(pos), { n, edges, step, steps: STEPS, width: WIDTH, height: HEIGHT, random, memory });
    for (let i = 0; i < n; i++) {
      let dx = Number(f[2 * i]), dy = Number(f[2 * i + 1]);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue;
      const len = Math.hypot(dx, dy);
      if (len > MAX_MOVE) { dx *= MAX_MOVE / len; dy *= MAX_MOVE / len; }
      pos[2 * i] = Math.min(WIDTH - MARGIN, Math.max(MARGIN, pos[2 * i] + dx));
      pos[2 * i + 1] = Math.min(HEIGHT - MARGIN, Math.max(MARGIN, pos[2 * i + 1] + dy));
    }
  }
  return measure(pos, edges);
}

// Score = 1 / (1 + crossings) + 0.1 * evenness - 0.02 * overlapping pairs.
// Evenness is 1 minus the coefficient of variation of edge lengths, floored at 0.
export function measure(pos: Float64Array, edges: Edge[]): WebResult {
  let crossings = 0;
  for (let a = 0; a < edges.length; a++) for (let b = a + 1; b < edges.length; b++) {
    const [p, q] = edges[a], [s, t] = edges[b];
    if (p === s || p === t || q === s || q === t) continue;
    if (crosses(pos[2 * p], pos[2 * p + 1], pos[2 * q], pos[2 * q + 1], pos[2 * s], pos[2 * s + 1], pos[2 * t], pos[2 * t + 1])) crossings++;
  }
  let overlaps = 0;
  const n = pos.length / 2;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    if (Math.hypot(pos[2 * i] - pos[2 * j], pos[2 * i + 1] - pos[2 * j + 1]) < 2 * RADIUS) overlaps++;
  const lens = edges.map(([a, b]) => Math.hypot(pos[2 * a] - pos[2 * b], pos[2 * a + 1] - pos[2 * b + 1]));
  const mean = lens.reduce((x, y) => x + y, 0) / lens.length;
  const sd = Math.sqrt(lens.reduce((x, y) => x + (y - mean) ** 2, 0) / lens.length);
  const evenness = mean > 0 ? Math.max(0, 1 - sd / mean) : 0;
  return { score: 1 / (1 + crossings) + 0.1 * evenness - 0.02 * overlaps, crossings, overlaps, evenness, positions: pos, edges };
}

export function picture(r: WebResult): string {
  const P = r.positions;
  const lines = r.edges.map(([a, b]) => `<line x1="${P[2 * a].toFixed(1)}" y1="${P[2 * a + 1].toFixed(1)}" x2="${P[2 * b].toFixed(1)}" y2="${P[2 * b + 1].toFixed(1)}"/>`).join("");
  const dots = Array.from({ length: P.length / 2 }, (_, i) => `<circle cx="${P[2 * i].toFixed(1)}" cy="${P[2 * i + 1].toFixed(1)}" r="${RADIUS / 2}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}"><rect width="100%" height="100%" fill="${PAPER}"/><g stroke="${INK}" stroke-width="1.4">${lines}</g><g fill="${ACCENT}">${dots}</g></svg>\n`;
}
