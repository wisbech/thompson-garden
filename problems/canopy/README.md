# Canopy

After Generative Design M_5_1 (recursion): grow a tree that catches the most light for the least wood.

**The world (judge/canopy/world.ts, protected).** An 800 × 600 frame, the root at the bottom centre, three suns
whose angles come from the commit (one to each side of overhead, one near it). The judge validates the tree,
gives it pipe-model thickness (a tip's branch has area 1, a parent's is the sum of its children's), puts a leaf
disc of radius 5 on every tip, and casts 600 parallel rays per sun across the frame.

**The agent (agent.ts, yours).** `grow(world)` returns the nodes: node 0 is the root with parent −1, every
other node names an earlier parent. At most 3,000 nodes, all inside the frame, and no two branches that share
no node may cross. `world` gives the frame, the root, the three sun angles and a seeded `random()`.

**The score.** Light minus wood: the mean share of rays that hit a leaf, minus the sum of branch length ×
area divided by 200,000. An invalid tree scores −1.

**Baseline.** M_5_1_01's symmetric binary tree, seven levels, each branch 0.6 of its parent at ±0.8 rad (narrower
or longer versions cross themselves): **0.2247**, light 0.34 for wood 23,000.
