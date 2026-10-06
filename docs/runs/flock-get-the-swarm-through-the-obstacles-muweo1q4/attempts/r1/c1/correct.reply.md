I changed `problems/flock/agent.ts` to address all five problems. I didn't run the tests or the judge, so I haven't checked that it scores above the base or that it keeps to the source rules in `judge/check.ts`.

1. **Zero distance:** `dist` is now `Math.max(hypot, 1e-6)`, so an agent sitting on an obstacle centre no longer produces NaN.
2. **Lane choice:** each side now gets a room score. The agent takes the side with more room, instead of flipping blindly when the first lane is out of bounds.
3. **Cancelling pushes:** only the nearest obstacle ahead applies the tangent steering. The close push-off still applies to every obstacle, so two close obstacles can no longer cancel each other's steering.
4. **Heading clamp:** the return is now `Math.atan2(vy, vx)`. An agent pushed backward can turn back or slide around the obstacle.
5. **Past-obstacle test:** an obstacle now counts as passed only when `o.dx < -o.r - 6`. The 6 is a fixed margin I picked to stand in for the agent's body clearance, because I haven't seen the judge's collision rule.

I haven't tuned any of the constants.
