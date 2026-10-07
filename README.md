# thompson-garden

Visual and agent problems for [Thompson](https://github.com/wisbech/thompson) to work on, after the agent
sketches in chapter 02_M of the [Generative Design p5.js code package](https://github.com/generative-design/Code-Package-p5.js/tree/master/02_M).
Thompson is pointed at this repository as a target; nothing here is part of Thompson, and Thompson stays atomic.

## Install Thompson: paste this into your agent

Open Claude Code (or another coding agent) in the repository you want Thompson to work on, and paste:

```text
Install Thompson in this repository and turn on its Claude Code plugin. Run each step yourself, and if one fails, stop and tell me what failed.

1. Check that `git` and `bun` are installed (`git --version`, `bun --version`). If bun is missing, tell me to install it from https://bun.sh and stop.
2. If `command -v thompson` finds nothing, install the Thompson command:
   git clone -b claude/lightweight-harness-18lhg4 https://github.com/wisbech/thompson ~/thompson
   cd ~/thompson && bun install && bun link
   Then use `export PATH="$HOME/.bun/bin:$PATH"` for the rest of these steps, and tell me to add that line to my shell profile if `~/.bun/bin` is not already on my PATH.
3. Back in this repository's root (it needs at least one commit), run `thompson init` unless a `.thompson/` folder already exists.
4. Turn on the plugin for this project:
   claude plugin marketplace add wisbech/thompson#claude/lightweight-harness-18lhg4
   claude plugin install thompson@thompson --scope project
   If the install says a userConfig option is not set, leave it: it defaults to the `thompson` command.
5. Show me the `.claude/settings.json` the install wrote and offer to commit it. Do not commit anything else.
6. Tell me to run /reload-plugins (or restart Claude Code), then add a first card with `thompson task "<title>" --accept "<what done means>" --verify "<a command that exits 0 when done>"` and type /thompson.

(Until Thompson's PR #1 is merged to main, the commands name the branch claude/lightweight-harness-18lhg4; once it is, drop `-b claude/lightweight-harness-18lhg4` and `#claude/lightweight-harness-18lhg4`.)
```

## How it is split

| Path | Owner | What it holds |
| --- | --- | --- |
| `judge/` | people (protected) | each problem's world, check and self-tests |
| `problems/<name>/` | cards | the agent a card may change; a README per problem |
| `site/index.html` | people (protected) | the Thompson page |
| `docs/runs/<card-id>/` | people (protected) | finished card folders, copied whole, one image per attempt |

The judge owns the world (the field, the physics, the food, the graph); the worker writes only the agent.
Judged runs use seeds derived from the commit under judgement, and every run has a fixed time budget.
Agents run inside the judge's process, so `judge/check.ts` refuses an agent that imports anything but types,
touches `process`, `globalThis` or `eval`, or reassigns built-ins or prototypes.

## Problems

| Problem | Agent | Baseline (fixed seeds 1, 2, 3) |
| --- | --- | --- |
| [Flow](problems/flow/) | where each trail starts | 0.8282 coverage |
| [Slime](problems/slime/) | how each Physarum agent senses, turns, deposits | 0.0222 |
| [Web](problems/web/) | the forces on each node | 0.1368 |
| [Flock](problems/flock/) | the heading each agent wants | 0.0183 |
| [Canopy](problems/canopy/) | the program that grows the tree | 0.2247 |
| [L-tree](problems/ltree/) | the grammar of a Lindenmayer system | −0.0352 |
| [Pack](problems/pack/), [Coral](problems/coral/), [Methuselah](problems/methuselah/) | proposed, no judge yet | |

`bun judge/check.ts <problem> --score` prints a baseline; `bun judge/check.ts all --score` is the project
score in `thompson.json` (the sum over every problem); `bun judge/check.ts <problem> --picture out` draws one.

## Run a card

From this directory, with a Thompson checkout at `$T`:

```sh
bun install
bun $T/src/cli.ts init
bun $T/src/cli.ts task "flow: cover the page more evenly" \
  --accept "the mean score beats the base on three commit-seeded worlds" \
  --verify "bun judge/check.ts flow --base $(git rev-parse HEAD)"
bun $T/adapters/refine/refine.ts --n 2 --d 2 --thompson "bun $T/src/cli.ts" --record docs/runs --json
```

Thompson is called from its own checkout rather than installed as a dependency: the repository is
private, and a git dependency would make the judge's `bun install` step need credentials.

Merging is a human act: read `docs/runs/<card-id>/run.md`, look at the images, merge by hand.
