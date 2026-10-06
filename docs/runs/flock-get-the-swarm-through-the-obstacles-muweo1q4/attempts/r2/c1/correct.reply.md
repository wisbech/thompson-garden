I made no edits. Checking `judge/flock/world.ts` and `judge/check.ts`, problems 1 and 2 turn out not to be faults, and 3 and 4 are risks I can't verify without running anything.

1. **`me.heading`:** it exists on `Me` and is an absolute angle in radians. The judge turns each agent toward the angle `steer` returns, so `a` is in the same frame. The cost term is correct and can't produce NaN.
2. **Obstacle frame:** `Seen.dx` and `dy` are world-axis offsets (`ob.x - ax[i]`), not heading-relative. Comparing them with `(c*d, s*d)` is correct.
3. **Look-ahead range:** the judge shows an obstacle when its edge is within `SEE_OBSTACLES` (60), and the agent measures `gap` from the edge. Probing out to 54 plus a 5 margin therefore covers nearly the whole visible range. Turning is capped at 0.15 rad/step at speed 2, so a 1.5 rad swerve needs about 20 px, well inside the window. I left the constants alone because I can't justify retuning them without running the judge.
4. **Separation:** the probe is short and ignores neighbour heading. That is minor, and a collision costs only 0.002 per pair against 1/200 = 0.005 per arrival. I left it as is.

The source rules in `judge/check.ts` (type-only imports, no `globalThis`, `process`, `Bun`, `eval`, `Function(`, no prototype tricks, no built-in reassignment) are all satisfied. The file only reads `Math.cos`, `Math.sin`, `Math.hypot` and `Math.abs`.

I did not run `bun judge/check.ts flock --base <base>`, so I can't confirm the score beats the base.
