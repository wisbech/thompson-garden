// The Flock world, owned by the judge: 200 agents cross an obstacle field from left to right, after
// Generative Design's agents (M_1_5) and Reynolds' boids. The judge owns speed, turning, sensing
// range, obstacles and collisions; the worker writes only the steering rule.
import { INK, ACCENT, PAPER, prng } from "../lib";

export const WIDTH = 1000, HEIGHT = 600;
export const AGENTS = 200, STEPS = 1500;
export const SPEED = 2, MAX_TURN = 0.15;        // px per step, radians per step
export const SEE_AGENTS = 30, SEE_OBSTACLES = 60;
export const BODY = 2;                          // two agents closer than 2 * BODY collide
export const GOAL_X = WIDTH - 20;

export interface Obstacle { x: number; y: number; r: number }
export interface Me { x: number; y: number; heading: number }
export interface Neighbour { dx: number; dy: number; heading: number }
export interface Seen { dx: number; dy: number; r: number }
export interface FlockAgent {
  // the heading you want, in radians; the judge turns you toward it by at most MAX_TURN
  steer(me: Me, neighbours: Neighbour[], obstacles: Seen[], world: { width: number; height: number; goalX: number; random(): number }): number;
}

export function obstaclesFor(seed: number): Obstacle[] {
  const r = prng(seed ^ 0xf10c), out: Obstacle[] = [];
  while (out.length < 14) {
    const o = { x: 180 + r() * 620, y: 30 + r() * (HEIGHT - 60), r: 25 + r() * 35 };
    if (out.every((p) => Math.hypot(p.x - o.x, p.y - o.y) > p.r + o.r + 12)) out.push(o);
  }
  return out;
}

export interface FlockResult { score: number; arrived: number; died: number; collisions: number; paths: [number, number][][]; obstacles: Obstacle[] }

// observe, if given, sees every agent's position, heading and state (0 flying, 1 arrived, 2 hit) after every step.
export function run(agent: FlockAgent, seed: number, budgetMs: number, observe?: (step: number, x: Float64Array, y: Float64Array, heading: Float64Array, state: Uint8Array) => void): FlockResult {
  const random = prng(seed ^ 0xb01d), obstacles = obstaclesFor(seed);
  const ax = new Float64Array(AGENTS), ay = new Float64Array(AGENTS), ah = new Float64Array(AGENTS);
  const state = new Uint8Array(AGENTS);          // 0 flying, 1 arrived, 2 hit an obstacle
  const paths: [number, number][][] = [];
  for (let i = 0; i < AGENTS; i++) { ax[i] = 10 + random() * 80; ay[i] = 20 + random() * (HEIGHT - 40); ah[i] = 0; paths.push([[ax[i], ay[i]]]); }
  const world = { width: WIDTH, height: HEIGHT, goalX: GOAL_X, random };
  const touched = new Set<number>();
  const C = SEE_OBSTACLES, gw = Math.ceil(WIDTH / C) + 1;
  const start = performance.now();
  for (let step = 0; step < STEPS; step++) {
    if (performance.now() - start > budgetMs) break;
    const grid = new Map<number, number[]>();
    for (let i = 0; i < AGENTS; i++) if (state[i] === 0) {
      const k = Math.floor(ay[i] / C) * gw + Math.floor(ax[i] / C);
      (grid.get(k) ?? grid.set(k, []).get(k)!).push(i);
    }
    const want = new Float64Array(AGENTS);
    for (let i = 0; i < AGENTS; i++) {
      if (state[i] !== 0) continue;
      const neighbours: Neighbour[] = [], seen: Seen[] = [];
      const cx = Math.floor(ax[i] / C), cy = Math.floor(ay[i] / C);
      for (let j = cy - 1; j <= cy + 1; j++) for (let k = cx - 1; k <= cx + 1; k++) for (const o of grid.get(j * gw + k) ?? []) {
        if (o === i) continue;
        const dx = ax[o] - ax[i], dy = ay[o] - ay[i];
        if (dx * dx + dy * dy <= SEE_AGENTS * SEE_AGENTS) neighbours.push({ dx, dy, heading: ah[o] });
      }
      for (const ob of obstacles) {
        const dx = ob.x - ax[i], dy = ob.y - ay[i];
        if (Math.hypot(dx, dy) - ob.r <= SEE_OBSTACLES) seen.push({ dx, dy, r: ob.r });
      }
      const w = agent.steer({ x: ax[i], y: ay[i], heading: ah[i] }, neighbours, seen, world);
      want[i] = Number.isFinite(w) ? w : ah[i];
    }
    for (let i = 0; i < AGENTS; i++) {
      if (state[i] !== 0) continue;
      let d = want[i] - ah[i];
      d = Math.atan2(Math.sin(d), Math.cos(d));
      ah[i] += Math.max(-MAX_TURN, Math.min(MAX_TURN, d));
      ax[i] += SPEED * Math.cos(ah[i]);
      ay[i] = Math.min(HEIGHT - 1, Math.max(1, ay[i] + SPEED * Math.sin(ah[i])));
      ax[i] = Math.max(1, ax[i]);
      if (step % 4 === 0) paths[i].push([ax[i], ay[i]]);
      if (ax[i] >= GOAL_X) { state[i] = 1; paths[i].push([ax[i], ay[i]]); continue; }
      if (obstacles.some((o) => Math.hypot(o.x - ax[i], o.y - ay[i]) < o.r)) { state[i] = 2; paths[i].push([ax[i], ay[i]]); }
    }
    for (let i = 0; i < AGENTS; i++) if (state[i] === 0) for (let j = i + 1; j < AGENTS; j++)
      if (state[j] === 0 && Math.abs(ax[i] - ax[j]) < 2 * BODY && Math.hypot(ax[i] - ax[j], ay[i] - ay[j]) < 2 * BODY) touched.add(i * AGENTS + j);
    observe?.(step, ax, ay, ah, state);
  }
  let arrived = 0, died = 0;
  const collisions = touched.size;
  for (let i = 0; i < AGENTS; i++) { if (state[i] === 1) arrived++; if (state[i] === 2) died++; }
  return { score: arrived / AGENTS - 0.002 * collisions, arrived, died, collisions, paths, obstacles };
}

// Score = share of agents that reach the right edge within STEPS, minus 0.002 for every pair of agents
// that ever touched (each pair counted once). Hitting an obstacle ends that agent.

export function picture(r: FlockResult): string {
  const obs = r.obstacles.map((o) => `<circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${o.r.toFixed(1)}"/>`).join("");
  const paths = r.paths.map((p) => `<path d="M${p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}"><rect width="100%" height="100%" fill="${PAPER}"/><g fill="${ACCENT}" fill-opacity="0.25" stroke="${ACCENT}">${obs}</g><g fill="none" stroke="${INK}" stroke-width="0.8" stroke-opacity="0.55">${paths}</g><line x1="${GOAL_X}" y1="0" x2="${GOAL_X}" y2="${HEIGHT}" stroke="${ACCENT}" stroke-dasharray="4 4"/></svg>\n`;
}
