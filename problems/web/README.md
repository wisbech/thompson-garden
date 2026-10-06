# Web

After Generative Design M_6_1: nodes repel, edges pull, and a tangled graph has to come undone.

**The world (judge/web/world.ts, protected).** A 7 × 7 grid graph with about 15% of its edges removed (never
disconnecting it) and its nodes shuffled, so a layout with no crossings is known to exist. Nodes start at random
in an 800 × 600 frame. 600 steps; each step the judge asks for forces, limits every node's move to 8 px and keeps
it 10 px inside the frame.

**The agent (agent.ts, yours).** `forces(positions, ctx)` returns the wanted move of every node.
`ctx` gives the node count, the edges, the step, the frame, a seeded `random()` and a `memory` object kept for
one run (for velocities and the like).

**The score.** 1 / (1 + edge crossings) + 0.1 × evenness of edge lengths − 0.02 per pair of nodes closer than
16 px. A perfect layout scores about 1.1.

**Baseline.** M_6_1_03's springs (repulsion within 100 px, rest length 60, damping one half): **0.1368**,
12 to 28 crossings.
