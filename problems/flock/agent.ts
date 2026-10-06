// The Flock agent: the heading each agent wants. The only file a Flock card changes.
// Self-contained: type imports only.
import type { FlockAgent } from "../../judge/flock/world";

// Look-ahead steering: try headings fanned around "straight right", fly the one whose path stays
// clearest of the obstacles in sight, prefer small turns and the current heading, and keep off neighbours.
const ANGLES = 25, FAN = 1.5, LOOK = 54, STEP = 6, MARGIN = 5;
const SEP_AT = 4, SEP = 10, SEP_W = 20;

export const steer: FlockAgent["steer"] = (me, neighbours, obstacles, world) => {
  let best = 0, bestCost = Infinity;
  for (let i = 0; i < ANGLES; i++) {
    const a = -FAN + (2 * FAN * i) / (ANGLES - 1);
    const c = Math.cos(a), s = Math.sin(a);
    let cost = Math.abs(a) * 1.5 + Math.abs(a - me.heading) * 0.8;
    for (let d = STEP; d <= LOOK; d += STEP) {
      const px = c * d, py = s * d;
      for (const o of obstacles) {
        const gap = Math.hypot(o.dx - px, o.dy - py) - o.r - MARGIN;
        if (gap < 0) cost += (1 - gap / MARGIN) * 40 * (1 - d / (LOOK + STEP));
      }
      const y = me.y + py;
      if (y < 8 || y > world.height - 8) cost += 6;
    }
    for (const n of neighbours) {
      const dist = Math.hypot(n.dx - c * SEP_AT, n.dy - s * SEP_AT);
      if (dist < SEP) cost += (SEP - dist) * SEP_W;
    }
    if (cost < bestCost) { bestCost = cost; best = a; }
  }
  return best;
};
