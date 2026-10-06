# Flow

After Generative Design M_1_5: agents ride a noise field and leave trails. Here the trails have to cover
the page as evenly as possible.

**The world (judge/flow/world.ts, protected).** A 1000 × 600 page, a two-octave value-noise field
(angle = noise × strength, as in M_1_5), spacing 12. The judge traces every trail itself in steps of 4,
in both directions from its start, and ends it at the edge, at half a spacing from another trail, or
where it would close on itself. A start closer than one spacing to a trail, or a trail shorter than 10
points, is refused.

**The agent (agent.ts, yours).** One function, `nextSeed(world)`, returns where the next trail starts,
or `null` to stop. `world` gives the size, the spacing, the field angle at a point, the trails so far,
the distance to the nearest trail, a seeded `random()` (use it instead of `Math.random`, so runs repeat),
the number of calls, and the number of starts refused since the last accepted trail. Keep the file
self-contained: type imports only, because the check also loads the base's copy on its own.

**The check.** `bun judge/check.ts flow --base <sha>` runs the base's agent and this commit's agent on
three fields seeded from this commit, 10 seconds and 200,000 calls each, and passes when this commit's
mean coverage is higher. Coverage is the share of the page within half a spacing of a trail.

**The score.** `bun judge/check.ts flow --score`: mean coverage on three fixed fields. Baseline, random
starts: **0.8282** (taken by hand on the first commit).

**Draw it.** `bun judge/check.ts flow --picture out` (writes out.svg).
