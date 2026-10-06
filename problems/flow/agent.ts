// The Flow agent: where the next trail starts. This is the only file a Flow card changes.
// It must stay self-contained (type imports only), because the check also loads the base's copy alone.
import type { FlowWorld, Point } from "../../judge/flow/world";

// Start each new trail just over one spacing beside an existing one (Jobard-Lefer seeding), working
// outward from the first trail; when no such place is left, fall back to random starts.
let queue: Point[] = [];
let head = 0;
let done = 0;
let lastCalls = Infinity;

export function nextSeed(world: FlowWorld): Point | null {
  if (world.calls <= lastCalls) { queue = []; head = 0; done = 0; }
  lastCalls = world.calls;
  const d = world.spacing * 1.01;
  const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < world.width && y < world.height && world.nearest(x, y) >= d - 0.02;
  for (;;) {
    while (head < queue.length) {
      const [x, y] = queue[head++];
      if (ok(x, y)) return [x, y];
    }
    if (done >= world.trails.length) break;
    queue = []; head = 0;
    const t = world.trails[done++];
    for (let i = 0; i < t.length; i += 2) {
      const p = t[i], q = t[Math.min(i + 1, t.length - 1)], r = t[Math.max(i - 1, 0)];
      const a = Math.atan2(q[1] - r[1], q[0] - r[0]) + Math.PI / 2;
      queue.push([p[0] + d * Math.cos(a), p[1] + d * Math.sin(a)], [p[0] - d * Math.cos(a), p[1] - d * Math.sin(a)]);
    }
  }
  if (world.missesInARow >= 6000) return null;
  return [world.random() * world.width, world.random() * world.height];
}
