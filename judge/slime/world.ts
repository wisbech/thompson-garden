// The Slime world, owned by the judge: a Physarum model after Jones (2010). The judge owns the
// trail grid, diffusion, decay, the food and the agents' bodies; the worker writes only the rule
// each agent uses to sense, turn and deposit.
import { prng } from "../lib";

export const W = 200, H = 120;            // grid cells
export const AGENTS = 3000;
export const STEPS = 600;
export const FOODS = 6;
export const DECAY = 0.1;                 // share of trail lost per step
export const FOOD_TRAIL = 10;             // what a food cell holds every step
export const THRESHOLD = 1.5;             // a cell at or above this is part of the network
export const MAX_SENSOR = 20, MAX_STEP = 2, MAX_DEPOSIT = 5;

export interface SlimeParams {
  sensorAngle: number;     // radians, between left/right sensor and heading
  sensorDistance: number;  // cells, at most MAX_SENSOR
  stepSize: number;        // cells per step, at most MAX_STEP
  deposit: number;         // trail added where the agent lands, at most MAX_DEPOSIT
}
export interface Sense { left: number; center: number; right: number; step: number }
export interface SlimeAgent {
  params: SlimeParams;
  turn(sense: Sense, random: () => number): number;   // radians to add to the heading, clamped to ±π/2
}

export interface SlimeResult { score: number; connected: boolean; pairs: number; cells: number; mst: number; trail: Float32Array; foods: [number, number][]; network: Uint8Array }

export function foodsFor(seed: number): [number, number][] {
  const r = prng(seed ^ 0x51), out: [number, number][] = [];
  while (out.length < FOODS) {
    const p: [number, number] = [Math.floor(15 + r() * (W - 30)), Math.floor(12 + r() * (H - 24))];
    if (out.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) > 30)) out.push(p);
  }
  return out;
}

export function mstLength(pts: [number, number][]): number {
  const inTree = [0], rest = pts.map((_, i) => i).slice(1);
  let total = 0;
  while (rest.length) {
    let best = Infinity, bi = 0;
    for (const i of inTree) rest.forEach((j, k) => { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < best) { best = d; bi = k; } });
    total += best; inTree.push(rest.splice(bi, 1)[0]);
  }
  return total;
}

// observe, if given, sees the trail grid after every step (for drawing; it must not change it).
export function run(agent: SlimeAgent, seed: number, budgetMs: number, observe?: (step: number, trail: Float32Array) => void): SlimeResult {
  const random = prng(seed ^ 0xa5a5), foods = foodsFor(seed);
  const p = agent.params;
  const SA = Math.max(0, Math.min(Math.PI, +p.sensorAngle || 0)), SO = Math.max(1, Math.min(MAX_SENSOR, +p.sensorDistance || 1));
  const SS = Math.max(0.2, Math.min(MAX_STEP, +p.stepSize || 1)), DEP = Math.max(0, Math.min(MAX_DEPOSIT, +p.deposit || 0));
  let trail = new Float32Array(W * H), next = new Float32Array(W * H);
  const ax = new Float64Array(AGENTS), ay = new Float64Array(AGENTS), ah = new Float64Array(AGENTS);
  for (let i = 0; i < AGENTS; i++) { ax[i] = random() * W; ay[i] = random() * H; ah[i] = random() * Math.PI * 2; }
  const at = (x: number, y: number) => {
    const i = Math.floor(((x % W) + W) % W), j = Math.floor(((y % H) + H) % H);
    return trail[j * W + i];
  };
  const start = performance.now();
  for (let step = 0; step < STEPS; step++) {
    if (performance.now() - start > budgetMs) break;
    for (const [fx, fy] of foods) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) trail[(fy + dy) * W + fx + dx] = FOOD_TRAIL;
    for (let i = 0; i < AGENTS; i++) {
      const s = (d: number) => at(ax[i] + SO * Math.cos(ah[i] + d), ay[i] + SO * Math.sin(ah[i] + d));
      let t = agent.turn({ left: s(-SA), center: s(0), right: s(SA), step }, random);
      t = Number.isFinite(t) ? Math.max(-Math.PI / 2, Math.min(Math.PI / 2, t)) : 0;
      ah[i] += t;
      let nx = ax[i] + SS * Math.cos(ah[i]), ny = ay[i] + SS * Math.sin(ah[i]);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) { ah[i] = random() * Math.PI * 2; nx = Math.min(W - 0.01, Math.max(0, nx)); ny = Math.min(H - 0.01, Math.max(0, ny)); }
      ax[i] = nx; ay[i] = ny;
      trail[Math.floor(ny) * W + Math.floor(nx)] += DEP;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {   // 3x3 mean, then decay
      let sum = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H) { sum += trail[yy * W + xx]; n++; }
      }
      next[y * W + x] = (sum / n) * (1 - DECAY);
    }
    [trail, next] = [next, trail];
    observe?.(step, trail);
  }
  return measure(trail, foods);
}

// The network is every cell at or above THRESHOLD. All foods must sit in one 4-connected piece of it.
// Connected: 0.1 + minimum-spanning-tree length over the network's cell count (a one-cell path of
// length L has about L cells, so a lean tree nears 1.1 and a Steiner tree a little more).
// Not connected: a tenth of the share of food pairs it joins, so joining always pays.
export function measure(trail: Float32Array, foods: [number, number][]): SlimeResult {
  const network = new Uint8Array(W * H);
  let cells = 0;
  for (let i = 0; i < W * H; i++) if (trail[i] >= THRESHOLD) { network[i] = 1; cells++; }
  const label = new Int32Array(W * H).fill(-1);
  let next = 0;
  for (let i = 0; i < W * H; i++) {
    if (!network[i] || label[i] >= 0) continue;
    const stack = [i]; label[i] = next;
    while (stack.length) {
      const c = stack.pop()!, x = c % W, y = (c - x) / W;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (network[n] && label[n] < 0) { label[n] = next; stack.push(n); }
      }
    }
    next++;
  }
  const lab = foods.map(([x, y]) => (network[y * W + x] ? label[y * W + x] : -1));
  let joined = 0, total = 0;
  for (let a = 0; a < lab.length; a++) for (let b = a + 1; b < lab.length; b++) { total++; if (lab[a] >= 0 && lab[a] === lab[b]) joined++; }
  const connected = joined === total, mst = mstLength(foods);
  const score = connected ? 0.1 + mst / Math.max(cells, 1) : 0.1 * (joined / total);
  return { score, connected, pairs: joined / total, cells, mst, trail, foods, network };
}

