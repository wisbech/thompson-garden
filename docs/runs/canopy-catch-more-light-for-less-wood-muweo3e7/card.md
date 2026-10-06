---
column: backlog
id: canopy-catch-more-light-for-less-wood-muweo3e7
title: canopy: catch more light for less wood
verify: bun judge/check.ts canopy --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
---
# canopy: catch more light for less wood

## Acceptance
- problems/canopy/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts canopy --base <base>)
- only problems/canopy/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The canopy problem: read problems/canopy/README.md and judge/canopy/world.ts (the world, protected) first. Change only problems/canopy/agent.ts. Baseline 0.2247 on fixed seeds; bun judge/check.ts canopy --score prints the current score and bun judge/check.ts canopy --picture /tmp/canopy draws it.
