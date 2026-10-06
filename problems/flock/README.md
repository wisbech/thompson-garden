# Flock

Two hundred agents cross a field of fourteen obstacles, placed from the commit, from the left edge to the right.

**The world (judge/flock/world.ts, protected).** A 1000 × 600 field; 1,500 steps. Every agent flies at 2 px
per step and turns at most 0.15 rad per step toward the heading it asks for. It sees other agents within 30 px
and obstacles within 60 px of their edge. Touching an obstacle ends that agent; crossing x = 980 counts it as
arrived.

**The agent (agent.ts, yours).** `steer(me, neighbours, obstacles, world)` returns the heading this agent wants.
Neighbours and obstacles come as offsets from the agent.

**The score.** The share of agents that arrive, minus 0.002 for every pair of agents that ever touched
(closer than 4 px).

**Baseline.** P_2_2_1's "stupid agent" given a goal, heading straight right: **0.0183**. Most fly into the
first obstacle in their row.
