---
column: backlog
id: flock-get-the-swarm-through-the-obstacles-muweo1q4
title: flock: get the swarm through the obstacles
verify: bun judge/check.ts flock --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
---
# flock: get the swarm through the obstacles

## Acceptance
- problems/flock/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flock --base <base>)
- only problems/flock/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The flock problem: read problems/flock/README.md and judge/flock/world.ts (the world, protected) first. Change only problems/flock/agent.ts. Baseline 0.0183 on fixed seeds; bun judge/check.ts flock --score prints the current score and bun judge/check.ts flock --picture /tmp/flock draws it.
