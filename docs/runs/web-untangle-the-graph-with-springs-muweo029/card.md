---
column: backlog
id: web-untangle-the-graph-with-springs-muweo029
title: web: untangle the graph with springs
verify: bun judge/check.ts web --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
---
# web: untangle the graph with springs

## Acceptance
- problems/web/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts web --base <base>)
- only problems/web/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The web problem: read problems/web/README.md and judge/web/world.ts (the world, protected) first. Change only problems/web/agent.ts. Baseline 0.1368 on fixed seeds; bun judge/check.ts web --score prints the current score and bun judge/check.ts web --picture /tmp/web draws it.
