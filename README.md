# thompson-garden

Visual and agent problems for [Thompson](https://github.com/wisbech/thompson) to work on, after the agent
sketches in chapter 02_M of the [Generative Design p5.js code package](https://github.com/generative-design/Code-Package-p5.js/tree/master/02_M).
Thompson is pointed at this repository as a target; nothing here is part of Thompson, and Thompson stays atomic.

## How it is split

| Path | Owner | What it holds |
| --- | --- | --- |
| `judge/` | people (protected) | each problem's world, check and self-tests |
| `problems/<name>/` | cards | the agent a card may change; a README per problem |
| `site/index.html` | people (protected) | the Thompson page |
| `docs/runs/<card-id>/` | people (protected) | finished card folders, copied whole, one image per attempt |

The judge owns the world (the field, the physics, the food, the graph); the worker writes only the agent.
Judged runs use seeds derived from the commit under judgement, and every run has a fixed time budget.

## Problems

| Problem | Status |
| --- | --- |
| [Flow](problems/flow/) | judge built; baseline 0.8282 |
| [Slime](problems/slime/), [Web](problems/web/), [Flock](problems/flock/), [Canopy](problems/canopy/) | proposed |
| [Pack](problems/pack/), [Coral](problems/coral/), [Methuselah](problems/methuselah/) | proposed (kept from the 01_P draft) |

## Run a Flow card

From this directory, with a Thompson checkout at `$T`:

```sh
bun install
bun $T/src/cli.ts init
bun $T/src/cli.ts task "flow: cover the page more evenly" \
  --accept "coverage beats the base on three commit-seeded fields" \
  --verify "bun judge/flow/check.ts --base $(git rev-parse HEAD)"
bun $T/adapters/refine/refine.ts --n 2 --d 2 --thompson "bun $T/src/cli.ts" --record docs/runs --json
```

Thompson is called from its own checkout rather than installed as a dependency: the repository is
private, and a git dependency would make the judge's `bun install` step need credentials.

Merging is a human act: read `docs/runs/<card-id>/run.md`, look at the images, merge by hand.
