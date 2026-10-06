// The Slime agent: how each of the 3,000 agents senses, turns and deposits. The only file a Slime card changes.
// Self-contained: type imports only.
import type { SlimeAgent } from "../../judge/slime/world";

// What the world rewards first is one piece of network that holds every food; Jones' rule alone leaves thick
// bands that miss foods. So the agents wander widely (step 2, strong deposit, wobble when the way ahead is
// best) and lean only gently toward trail. Measured on the fixed seeds: this scores 0.114 against 0.011 for
// Jones' rule, and a smaller wobble, a bigger turn or a weaker deposit all scored lower (0.01 to 0.04). Foods
// are 3x3 blocks the judge holds at full trail, so a step of 2 cannot hop over one.
export const params: SlimeAgent["params"] = { sensorAngle: 0.5, sensorDistance: 12, stepSize: 2, deposit: 4 };

const TURN = 0.1, WOBBLE = 1;

export const turn: SlimeAgent["turn"] = ({ left, center, right }, random) => {
  if (center >= left && center >= right) return (random() - 0.5) * WOBBLE;
  if (center < left && center < right) return random() < 0.5 ? -TURN : TURN;
  return left > right ? -TURN : TURN;
};
