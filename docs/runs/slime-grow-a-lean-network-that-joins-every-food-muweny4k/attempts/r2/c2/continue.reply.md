I rewrote `problems/slime/agent.ts`, and its fixed-seed score is now 0.1140. Your previous attempt scored 0.0089, which is below the 0.0222 baseline. I didn't get a clean `--base` run: the one I tried pointed at a commit that predates the file and errored. I didn't try again.

- **Score:** I tested the same settings on eight seeds, and in every run one piece of network joined all six foods.
- **The approach:** the agents wander widely (step 2, deposit 4, big random wobble) and only lean gently toward trail. That covers the grid with a thin, even mesh that reaches every food.
- **Why not a leaner network:** this is closer to flooding than a lean tree, so the score sits near the connected floor of 0.1 plus a small term for how lean the network is.
- **What I tried:** Jones-style climbing with strong pull, trail-level caps like your previous attempt, and a two-phase scheme that floods first and then prunes. Pruning broke connectivity on most seeds. The best flood variants all landed at about 0.11 to 0.117.
- **Rules and scope:** only `problems/slime/agent.ts` changed, and it uses a type import only.
