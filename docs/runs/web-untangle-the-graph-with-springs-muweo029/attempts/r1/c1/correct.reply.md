I edited `problems/web/agent.ts` to address problems 1, 2 and 5. Problems 3 and 4 needed no change, and I didn't run the tests or `judge/check.ts`, so I haven't measured the score against the base.

- **Problem 1 (missing context fields):** `ctx.step`, `ctx.steps`, `ctx.width` and `ctx.height` are all on `WebContext` in `judge/web/world.ts`. I removed the hard-coded 600. The schedule now reads `ctx.steps` and falls back to 0 and 600 if either is undefined, so `t` can't become NaN.
- **Problem 2 (sawtooth cooling):** I replaced the three-phase schedule with one monotone curve, `t = 8·(1 − step/steps)² + 0.1`. It has no reheats. That also makes the "settles over the run" comment accurate.
- **Problem 5 (`K_SCALE`):** I inlined `0.35` and deleted the trailing constant.
- **Problem 3 (velocity vs displacement):** The world applies the returned vector as a per-step displacement, capped at `MAX_MOVE = 8`. So the cap `t` is on the same scale as the world's integrator.
- **Problem 4 (drifting out of frame):** The world clamps positions to the margin every step, so nodes can't leave the frame.
- **Acceptance rules:** The edit adds no imports, no `process` or `globalThis`, and no reassignment of built-ins, so it stays within the source rules in `judge/check.ts`.

I changed only `problems/web/agent.ts`.
