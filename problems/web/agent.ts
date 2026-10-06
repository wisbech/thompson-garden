// The Web agent: the forces that move each node. The only file a Web card changes.
// Self-contained: type imports only.
import type { WebAgent } from "../../judge/web/world";

// Baseline, after M_6_1_03: every node repels every other within 100 px, every edge is a spring of
// rest length 60, velocities damped by half each step.
export const forces: WebAgent["forces"] = (p, ctx) => {
  const n = ctx.n, v = (ctx.memory.v ??= new Float64Array(2 * n)) as Float64Array;
  const f = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    const dx = p[2 * i] - p[2 * j], dy = p[2 * i + 1] - p[2 * j + 1], d = Math.hypot(dx, dy) || 0.01;
    if (d < 100) { const s = (100 - d) / 100 * 2; f[2 * i] += dx / d * s; f[2 * i + 1] += dy / d * s; }
  }
  for (const [a, b] of ctx.edges) {
    const dx = p[2 * b] - p[2 * a], dy = p[2 * b + 1] - p[2 * a + 1], d = Math.hypot(dx, dy) || 0.01, s = (d - 60) * 0.05;
    f[2 * a] += dx / d * s; f[2 * a + 1] += dy / d * s; f[2 * b] -= dx / d * s; f[2 * b + 1] -= dy / d * s;
  }
  for (let k = 0; k < 2 * n; k++) { v[k] = (v[k] + f[k]) * 0.5; }
  return v;
};
