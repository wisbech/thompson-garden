# Slime

Physarum agents (Jones, 2010) grow a transport network between six food sources the judge places from the commit.

**The world (judge/slime/world.ts, protected).** A 200 × 120 trail grid; 3,000 agents placed at random; 600 steps.
Each step the food cells are refilled, every agent senses, turns, moves and deposits, then the grid is blurred
(3 × 3 mean) and decays by 10%. The judge owns all of that, the agents' bodies and the walls.

**The agent (agent.ts, yours).** `params` (sensor angle, sensor distance up to 20, step size up to 2, deposit up
to 5) and `turn(sense, random)`, which gets the trail under the left, centre and right sensors and the step
number, and returns how far to turn (clamped to ±90°).

**The score.** The network is every cell whose trail is at least 1.5. If one 4-connected piece of it joins every
food: 0.1 + the foods' minimum-spanning-tree length divided by the network's cell count (a lean tree nears 1.1).
Otherwise a tenth of the share of food pairs it joins, so joining always pays.

**Baseline.** Jones' rule and angles (sensors at 45°, 9 cells out, turn 45° toward the strongest, deposit 1):
**0.0222**. It draws thick bands that join a few foods and miss the rest.
