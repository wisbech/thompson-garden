# role: generate

You are the worker on card canopy-catch-more-light-for-less-wood-muweo3e7: canopy: catch more light for less wood.

Make the change in the current working directory so that every acceptance criterion holds. Edit files directly.
Do not run the project's tests: a judge you cannot see runs the card's check afterwards, and your job is to make
that check pass on the first judging. Never edit a protected path.

## Task
canopy: catch more light for less wood

## Acceptance
- problems/canopy/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts canopy --base <base>)
- only problems/canopy/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The canopy problem: read problems/canopy/README.md and judge/canopy/world.ts (the world, protected) first. Change only problems/canopy/agent.ts. Baseline 0.2247 on fixed seeds; bun judge/check.ts canopy --score prints the current score and bun judge/check.ts canopy --picture /tmp/canopy draws it.

## Score (higher is better)
The project's own measure, 1.230212 at the base (command: bun judge/check.ts all --score; higher is better). Within the acceptance criteria, the bigger the rise the better; a change
that passes the check by the smallest possible margin is a weak result.

## Protected paths (never edit)
checks/
src/kernel/
KERNEL.md
CODEOWNERS
thompson.json
package.json
bunfig.toml
bun.lock
bun.lockb
package-lock.json
yarn.lock
pnpm-lock.yaml
judge/
site/
docs/
tsconfig.json
README.md

Mechanism paths (this is an ordinary card; a rollout that touches them is refused by the host before the judge):
adapters/
src/
