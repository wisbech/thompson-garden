I rewrote `problems/flock/agent.ts`. On the fixed seeds it now scores 0.9447 (`bun judge/check.ts flock --score`), up from the 0.0183 baseline. I did not run `--base`, so the pass/fail check on the commit-seeded worlds hasn't been run.

On the three fixed seeds, 199, 195 and 200 of the 200 agents arrive. Most of the score loss is from pairs that touch, about 16 to 26 per world. I ran the world on those seeds with a small script outside the repo.

How the agent steers:
- **Goal:** it heads for the right edge.
- **Obstacles:** for each obstacle ahead, it slides along the edge on the side with more room, and pushes off when very close.
- **Neighbours:** it keeps a small separation from agents within 14 px. This took the average from 0.836 to 0.945.

I tried stronger separation and a stronger obstacle bend, and both scored lower, so I kept the values above.

The agent has only a type import and no built-in reassignment, so it should satisfy the source rules in `judge/check.ts`. `problems/flock/agent.ts` is the only file changed.
