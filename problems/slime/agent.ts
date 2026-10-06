// The Slime agent: how each of the 3,000 agents senses, turns and deposits. The only file a Slime card changes.
// Self-contained: type imports only.
import type { SlimeAgent } from "../../judge/slime/world";

// Climb toward a trail level, not toward the strongest trail: attraction saturates at TARGET (a little above the
// network threshold), so a thick band is no better than a thin one and agents stop piling into one fat route.
// Anything at or above TARGET, food included, still attracts fully; only the surplus is ignored.
export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 8, stepSize: 1.5, deposit: 0.8 };

const TARGET = 2.5, TURN = 0.5;

export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
  if (Math.max(left, center, right) < 0.02) return (random() - 0.5) * 0.3; // blank ground: drift (the world reflects walls)
  const pull = (v: number) => Math.min(v, TARGET) + 0.01 * v;
  const l = pull(left), c = pull(center), r = pull(right);
  if (c >= l && c >= r) return (random() - 0.5) * 0.1; // aligned: small jitter so parallel lines do not lock
  if (c < l && c < r) return random() < 0.5 ? -TURN : TURN;
  return l > r ? -TURN : TURN;
};
