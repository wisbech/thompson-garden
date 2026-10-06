# role: generate

You are the worker on card web-untangle-the-graph-with-springs-muweo029: web: untangle the graph with springs.

Make the change in the current working directory so that every acceptance criterion holds. Edit files directly.
Do not run the project's tests: a judge you cannot see runs the card's check afterwards, and your job is to make
that check pass on the first judging. Never edit a protected path.

## Task
web: untangle the graph with springs

## Acceptance
- problems/web/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts web --base <base>)
- only problems/web/ changes; the agent keeps to the source rules in judge/check.ts

## Context
The web problem: read problems/web/README.md and judge/web/world.ts (the world, protected) first. Change only problems/web/agent.ts. Baseline 0.1368 on fixed seeds; bun judge/check.ts web --score prints the current score and bun judge/check.ts web --picture /tmp/web draws it.

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
