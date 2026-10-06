// The Slime agent: how each of the 3,000 agents senses, turns and deposits. The only file a Slime card changes.
// Self-contained: type imports only.
import type { SlimeAgent } from "../../judge/slime/world";

// Seek a trail level, not the strongest trail: agents drawn to the maximum collapse into one fat band that
// misses most foods. Aiming for TARGET (a little above the network threshold) keeps the mass spread thin
// along many routes, and food cells (trail 10) push agents out along straight rays that find the other foods.
export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 8, stepSize: 1.5, deposit: 0.8 };

const TARGET = 2.5, TURN = 0.5;

export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
  if (Math.max(left, center, right) < 0.02) return (random() - 0.5) * 0.3; // blank ground: drift straight
  const miss = (v: number) => Math.abs(v - TARGET);
  const l = miss(left), c = miss(center), r = miss(right);
  if (c <= l && c <= r) return 0;
  if (c > l && c > r) return random() < 0.5 ? -TURN : TURN;
  return l < r ? -TURN : TURN;
};
