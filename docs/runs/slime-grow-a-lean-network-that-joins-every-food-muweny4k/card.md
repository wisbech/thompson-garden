---
column: backlog
id: slime-grow-a-lean-network-that-joins-every-food-muweny4k
title: slime: grow a lean network that joins every food
verify: bun judge/check.ts slime --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
---
# slime: grow a lean network that joins every food

## Acceptance
- problems/slime/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts slime --base <base>)
- only problems/slime/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The slime problem: read problems/slime/README.md and judge/slime/world.ts (the world, protected) first. Change only problems/slime/agent.ts. Baseline 0.0222 on fixed seeds; bun judge/check.ts slime --score prints the current score and bun judge/check.ts slime --picture /tmp/slime draws it.
