I reworked `problems/flock/agent.ts` to address all five problems. I haven't run the judge or the tests, so I don't know whether it beats the base.

1. **Side flipping:** the lane choice is now deterministic. It compares lane room with an 8-unit margin. Inside the margin, it breaks the tie from the obstacle's world y (`me.y + o.dy`). Every agent computes the same value at every step, so the choice can't flip mid-approach.
2. **Only the nearest obstacle steered:** I removed the nearest-obstacle logic. Every obstacle ahead now gets tangent steering, each weighted by its own proximity.
3. **Lane ignored other obstacles:** the room check now subtracts clearance from any obstacle that overlaps the lane along the way, so a wide lane that the next obstacle blocks scores lower.
4. **Separation and edge nudges:** the 14 and 0.15 constants are now named. The edge nudge went from 0.5 to 1.5 so it counts against the obstacle terms. I did not add alignment or cohesion, because that would go beyond the listed fixes.
5. **Redundant loops:** the two loops are merged into one pass over the obstacles ahead.

The file still has only a type-only import and uses only `Math.*`, with no randomness or I/O. I couldn't read `judge/check.ts`, so I haven't confirmed the source rules. No other files changed.
