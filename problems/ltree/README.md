# L-tree

A Lindenmayer system (Prusinkiewicz and Lindenmayer, *The Algorithmic Beauty of Plants*, 1990): you write the
grammar, the judge grows it and puts it in the light.

**The world (judge/ltree/world.ts, protected).** The judge rewrites the axiom up to 7 times (at most 400,000
symbols), then walks a turtle from the root at the bottom centre of an 800 × 600 frame, heading up. `F` and `G`
draw a step, `f` moves without drawing (only allowed inside a branch that is then closed), `+` and `-` turn,
`[` and `]` push and pop, `!` shrinks the step. At most 6,000 segments, all inside the frame. Three suns come
from the commit.

**The agent (agent.ts, yours).** `grammar(world)` returns `{ axiom, rules, iterations, angle, step, shrink? }`.
`world` gives the frame and the three sun angles.

**The score.** Light minus wood, as in Canopy, with Canopy's hole closed from the start: the root must have
exactly one trunk, so every leaf pays for the wood beneath it through the pipe model, and tips lower than
120 px above the ground sit in the shaded understory and catch nothing. Light is the mean share of 600 parallel
rays per sun that hit a leaf (radius 5, on every tip); wood is the sum of branch length × pipe-model area,
divided by 200,000.

**Baseline.** The fractal plant, figure 1.24f (`X → F+[[X]-X]-F[-FX]+X`, `F → FF`, 25°, five iterations):
**−0.0352**, light 0.28 for wood 64,000.
