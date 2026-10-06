---
column: backlog
id: ltree-a-grammar-that-catches-more-light-for-less-wood-muwfb38f
title: ltree: a grammar that catches more light for less wood
verify: bun judge/check.ts ltree --base 842899608b6dcfaca1235bfb3d60c653733d8494
---
# ltree: a grammar that catches more light for less wood

## Acceptance
- problems/ltree/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts ltree --base <base>)
- only problems/ltree/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The ltree problem: read problems/ltree/README.md and judge/ltree/world.ts (the world, protected) first. Change only problems/ltree/agent.ts. Baseline -0.0352 on fixed seeds; bun judge/check.ts ltree --score prints the current score and bun judge/check.ts ltree --picture /tmp/ltree draws it.
