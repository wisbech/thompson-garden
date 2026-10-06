// The Flow world, owned by the judge. A noise field in the manner of Generative Design M_1_5
// (angle = noise(x / scale, y / scale) * strength), and an integrator that traces each agent's
// trail through it. The worker never traces: it only says where the next agent starts.

export const WIDTH = 1000;
export const HEIGHT = 600;
export const SPACING = 12;                 // trails never come closer than half of this
export const STEP = SPACING / 3;
export const MIN_POINTS = 10;              // shorter trails are rejected
export const MAX_POINTS = 2000;            // per direction
export const MAX_CALLS = 200_000;          // nextSeed calls per run

export type Point = [number, number];

export interface FlowWorld {
  readonly width: number;
  readonly height: number;
  readonly spacing: number;
  angle(x: number, y: number): number;           // field direction in radians
  readonly trails: readonly (readonly Point[])[]; // accepted trails so far
  nearest(x: number, y: number): number;          // distance to the nearest trail point, Infinity beyond 2 spacings
  random(): number;                                // seeded; use this, not Math.random, so runs repeat
  readonly calls: number;                          // nextSeed calls so far
  readonly missesInARow: number;                   // seeds rejected since the last accepted trail
}

export interface FlowAgent { nextSeed(world: FlowWorld): Point | null }

export function prng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {                                  // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Two octaves of smooth value noise on a seeded lattice, in [0, 1).
export function makeField(seed: number): (x: number, y: number) => number {
  const rnd = prng(seed);
  const N = 256, lattice = Float64Array.from({ length: N * N }, rnd);
  const scale = 300 + rnd() * 200, strength = 2 * Math.PI * (1.5 + rnd());
  const at = (i: number, j: number) => lattice[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y), u = smooth(x - i), v = smooth(y - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
    return a + (b - a) * v;
  };
  return (x, y) => (noise(x / scale, y / scale) * 0.7 + noise(x / scale * 2 + 17, y / scale * 2 + 31) * 0.3) * strength;
}

export interface RunResult { trails: Point[][]; coverage: number; calls: number; cut: "agent" | "budget" | "calls" }

export function run(agent: FlowAgent, seed: number, budgetMs: number): RunResult {
  const angle = makeField(seed), random = prng(seed ^ 0x9e3779b9);
  const D = SPACING, gw = Math.ceil(WIDTH / D) + 1, gh = Math.ceil(HEIGHT / D) + 1;
  const grid: { x: number; y: number; t: number; k: number }[][] = Array.from({ length: gw * gh }, () => []);
  const trails: Point[][] = [];
  let calls = 0, missesInARow = 0;

  const cellsNear = function* (x: number, y: number, reach: number) {
    const cx = Math.floor(x / D), cy = Math.floor(y / D);
    for (let j = cy - reach; j <= cy + reach; j++) for (let i = cx - reach; i <= cx + reach; i++)
      if (i >= 0 && j >= 0 && i < gw && j < gh) yield grid[j * gw + i];
  };
  const nearest = (x: number, y: number) => {
    let best = Infinity;
    for (const c of cellsNear(x, y, 2)) for (const p of c) best = Math.min(best, Math.hypot(p.x - x, p.y - y));
    return best <= 2 * D ? best : Infinity;
  };
  const crowded = (x: number, y: number, r: number) => {
    for (const c of cellsNear(x, y, 1)) for (const p of c) if ((p.x - x) ** 2 + (p.y - y) ** 2 < r * r) return true;
    return false;
  };
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;

  const trace = (x0: number, y0: number): Point[] | null => {
    if (!inside(x0, y0) || crowded(x0, y0, D)) return null;
    const halves: Point[][] = [];
    const own = new Map<number, { x: number; y: number; n: number }[]>(); // this trail's points, to stop it closing on itself
    let n = 0;
    const closing = (x: number, y: number) => {
      const cx = Math.floor(x / D), cy = Math.floor(y / D);
      for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++)
        for (const p of own.get(j * gw + i) ?? []) if (n - p.n > 6 && (p.x - x) ** 2 + (p.y - y) ** 2 < (D / 2) ** 2) return true;
      return false;
    };
    for (const dir of [1, -1]) {
      const pts: Point[] = [];
      let x = x0, y = y0;
      for (let k = 0; k < MAX_POINTS; k++) {
        const a = angle(x, y);
        x += dir * STEP * Math.cos(a); y += dir * STEP * Math.sin(a);
        if (!inside(x, y) || crowded(x, y, D / 2) || closing(x, y)) break;
        pts.push([x, y]);
        const c = Math.floor(y / D) * gw + Math.floor(x / D);
        own.set(c, [...(own.get(c) ?? []), { x, y, n: n++ }]);
      }
      halves.push(pts);
    }
    const pts = [...halves[1].reverse(), [x0, y0] as Point, ...halves[0]];
    return pts.length >= MIN_POINTS ? pts : null;
  };

  const world: FlowWorld = {
    width: WIDTH, height: HEIGHT, spacing: D, angle, trails, nearest, random,
    get calls() { return calls; }, get missesInARow() { return missesInARow; },
  };

  const start = performance.now();
  let cut: RunResult["cut"] = "agent";
  for (;;) {
    if (performance.now() - start > budgetMs) { cut = "budget"; break; }
    if (calls >= MAX_CALLS) { cut = "calls"; break; }
    calls++;
    const s = agent.nextSeed(world);
    if (s === null) break;
    const [x, y] = s;
    const pts = Number.isFinite(x) && Number.isFinite(y) ? trace(x, y) : null;
    if (!pts) { missesInARow++; continue; }
    missesInARow = 0;
    const t = trails.length;
    pts.forEach(([px, py], k) => grid[Math.floor(py / D) * gw + Math.floor(px / D)].push({ x: px, y: py, t, k }));
    trails.push(pts);
  }
  return { trails, coverage: coverage(trails), calls, cut };
}

// Share of the page within half a spacing of a trail point, sampled on a grid of half spacings.
export function coverage(trails: Point[][]): number {
  const D = SPACING, r2 = (D / 2) ** 2, gw = Math.ceil(WIDTH / D) + 1, gh = Math.ceil(HEIGHT / D) + 1;
  const grid: Point[][] = Array.from({ length: gw * gh }, () => []);
  for (const t of trails) for (const p of t) grid[Math.floor(p[1] / D) * gw + Math.floor(p[0] / D)].push(p);
  let n = 0, hit = 0;
  for (let y = D / 4; y < HEIGHT; y += D / 2) for (let x = D / 4; x < WIDTH; x += D / 2) {
    n++;
    const cx = Math.floor(x / D), cy = Math.floor(y / D);
    search: for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
      if (i < 0 || j < 0 || i >= gw || j >= gh) continue;
      for (const [px, py] of grid[j * gw + i]) if ((px - x) ** 2 + (py - y) ** 2 <= r2) { hit++; break search; }
    }
  }
  return hit / n;
}

// The closest any two different trails come; the judge's own guarantee is >= SPACING / 2.
export function minSeparation(trails: Point[][]): number {
  let best = Infinity;
  for (let a = 0; a < trails.length; a++) for (let b = a + 1; b < trails.length; b++)
    for (const [x1, y1] of trails[a]) for (const [x2, y2] of trails[b]) {
      const d = Math.hypot(x1 - x2, y1 - y2);
      if (d < best) best = d;
    }
  return best;
}

export function toSvg(trails: Point[][]): string {
  const paths = trails.map((t) => `<path d="M${t.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}"/>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
<rect width="100%" height="100%" fill="#FAFBF8"/>
<g fill="none" stroke="#1F6B57" stroke-width="1.2" stroke-linecap="round">
${paths}
</g>
</svg>
`;
}
