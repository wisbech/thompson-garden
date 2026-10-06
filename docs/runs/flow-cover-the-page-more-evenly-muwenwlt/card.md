---
column: backlog
id: flow-cover-the-page-more-evenly-muwenwlt
title: flow: cover the page more evenly
verify: bun judge/check.ts flow --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
---
# flow: cover the page more evenly

## Acceptance
- problems/flow/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flow --base <base>)
- only problems/flow/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The flow problem: read problems/flow/README.md and judge/flow/world.ts (the world, protected) first. Change only problems/flow/agent.ts. Baseline 0.8282 on fixed seeds; bun judge/check.ts flow --score prints the current score and bun judge/check.ts flow --picture /tmp/flow draws it.
