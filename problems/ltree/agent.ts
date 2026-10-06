// The L-tree agent: the grammar. The only file an L-tree card changes.
// Self-contained: type imports only.
import type { LTreeAgent } from "../../judge/ltree/world";

// Baseline: Prusinkiewicz and Lindenmayer's "fractal plant" (The Algorithmic Beauty of Plants, figure 1.24f),
// set upright on the root.
export const grammar: LTreeAgent["grammar"] = () => ({
  axiom: "X",
  rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
  iterations: 5,
  angle: 25,
  step: 4.5,
});
