// The Slime agent: how each of the 3,000 agents senses, turns and deposits. The only file a Slime card changes.
// Self-contained: type imports only.
import type { SlimeAgent } from "../../judge/slime/world";

// Baseline: Jones' (2010) rule and angles: sensors at 45°, 9 cells out, turn 45° toward the strongest.
export const params: SlimeAgent["params"] = { sensorAngle: Math.PI / 4, sensorDistance: 9, stepSize: 1, deposit: 1 };

export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
  const ra = Math.PI / 4;
  if (center >= left && center >= right) return 0;
  if (center < left && center < right) return random() < 0.5 ? -ra : ra;
  return left > right ? -ra : ra;
};
