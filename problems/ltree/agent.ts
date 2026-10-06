// The L-tree agent: the grammar. The only file an L-tree card changes.
// Self-contained: type imports only.
import type { LTreeAgent } from "../../judge/ltree/world";

// A bifurcating tree with one trunk, a central continuation and almost no shrinking (`!` multiplies the
// step by `shrink`, both in the judge's alphabet). It stays inside the frame, has 81 tips against the
// base's 256, and on seeds 1-3 scores about 0.29-0.31 (light about 0.47, wood about 35,700) where the
// base scores about -0.03 (wood about 63,900).
export const grammar: LTreeAgent["grammar"] = () => ({
  axiom: "FX",
  rules: { X: "!F[+X][-X]F[X]" },
  iterations: 5,
  angle: 40.15,
  step: 54.4,
  shrink: 0.99,
});
