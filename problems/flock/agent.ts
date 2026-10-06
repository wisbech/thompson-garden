// The Flock agent: the heading each agent wants. The only file a Flock card changes.
// Self-contained: type imports only.
import type { FlockAgent } from "../../judge/flock/world";

// Baseline, the "stupid agent" of P_2_2_1 given a goal: head straight for the right edge.
export const steer: FlockAgent["steer"] = () => 0;
