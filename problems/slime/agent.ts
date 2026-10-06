// The agent: a trail agent that one rule keeps wide awake.
// Self-contained: type imports only.
import type { SlimeAgent } from "../../judge/slime/world";

// What the world rewards first is one piece of network that holds every food; Jones' rule alone leaves thick
// bands that miss foods. So the agents wander widely (step 2, strong deposit, big random wobble) and only lean
// gently toward trail, which lays a thin, even mesh that reaches every food, the food cells included.
export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 12, stepSize: 2, deposit: 4 };

const TURN = 0.1, WOBBLE = 1;

export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
  if (center >= left && center >= right) return (random() - 0.5) * WOBBLE;
  if (center < left && center < right) return random() < 0.5 ? -TURN : TURN;
  return left > right ? -TURN : TURN;
};
