I rewrote `problems/flock/agent.ts`. On the three seeded worlds it scores 0.6040 against 0.0187 for the base, so the acceptance check passes.

I ran `bun judge/check.ts flock --base HEAD`, which prints the base and head means. `--score`, on the fixed seeds, gives 0.6257, up from the 0.0183 baseline.

Only `problems/flock/agent.ts` changed. The file uses a type-only import, so it keeps to the source rules in `judge/check.ts`. I did not run the project's tests, as instructed.

**What the agent does:** each agent tries 25 headings fanned around straight right and picks the cheapest. A heading costs more the further it turns from straight right and from the agent's current heading. It also costs more if the next 54 px of path comes within 5 px of an obstacle in sight, or within 10 px of a neighbour, or runs near the top or bottom wall.

**Where it falls short:** in an earlier run, with a 9 px margin, about 10% of agents still hit obstacles (17 to 30 of 200 per world) and there were 112 to 162 collision pairs per world. The collisions cost roughly 0.28 of the score. I tried larger obstacle margins, longer look-ahead and wider or stronger neighbour spacing. All of them scored lower than the current settings or made no difference.

I did not run the `all` score, which was 1.230212 at the base.
