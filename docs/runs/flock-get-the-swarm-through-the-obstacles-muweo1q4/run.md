# Run of card flock-get-the-swarm-through-the-obstacles-muweo1q4: flock: get the swarm through the obstacles

- Started 2026-10-06T08:17:14.454Z, finished 2026-10-06T08:41:53.255Z
- Host: adapters/refine, N = 2, D = 2, 900 s per model call, model `claude -p --permission-mode bypassPermissions --output-format text`
- Base: 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
- Outcome: PASSED: the judge accepted refine/flock-get-the-swarm-through-the-obstacles-muweo1q4/r2; flock-get-the-swarm-through-the-obstacles-muweo1q4 is done
- Score (thompson.json `score`, higher is better): base 1.230212, candidate 2.110212

## The card

### Task

flock: get the swarm through the obstacles

### Acceptance

- problems/flock/agent.ts scores higher than the base on three worlds seeded from the commit (bun judge/check.ts flock --base <base>)
- only problems/flock/ changes; the agent keeps to the source rules in judge/check.ts

### Check

`bun judge/check.ts flock --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102`

### Context carried in

The flock problem: read problems/flock/README.md and judge/flock/world.ts (the world, protected) first. Change only problems/flock/agent.ts. Baseline 0.0183 on fixed seeds; bun judge/check.ts flock --score prints the current score and bun judge/check.ts flock --picture /tmp/flock draws it.

## Rollouts

| rollout | branch | cycles | cost (chars in + out) | commit | judge | score |
|---|---|---|---|---|---|---|
| r1 | refine/flock-get-the-swarm-through-the-obstacles-muweo1q4/r1 | 2 | 30993 | b4e2d2bdf0ee | failed | - |
| r2 | refine/flock-get-the-swarm-through-the-obstacles-muweo1q4/r2 | 2 | 32027 | f420b19ab4b3 | passed | 2.110212 |

## What the critic said last, per rollout

### r1

CRITERIA:
- 1: uncertain. The diff gives no scores, and I haven't run `judge/check.ts`. The steering is plausible: it takes a tangent around the nearest obstacle ahead and picks the lane with more room. Nothing in the diff shows it beats the base on three seeded worlds.
- 2: pass. Only `problems/flock/agent.ts` changes, and it keeps the type-only import. I can't see `judge/check.ts`, so I can't confirm the source rules. The code uses only `Math.*` and no randomness or I/O, so I found no violation.

PROBLEMS:
1. `problems/flock/agent.ts`: the first loop picks `near` using `Math.hypot(o.dx,o.dy) - o.r` over all obstacles ahead, with no range limit. A distant obstacle can win and get `w = 0`, which is harmless. But `side` is derived from `o.dy > 0 ? -1 : 1` each step, with only the room comparison to break ties. For an obstacle almost dead ahead (`dy ≈ 0`) and roughly equal room on both sides, `side` can flip from one step to the next. The agent then pushes straight into the obstacle or jitters in front of it. Add hysteresis or a deterministic tie-break, for example by the agent's own `me.y` or by room with a margin.
2. `problems/flock/agent.ts`: only the single nearest obstacle gets tangent steering. Two obstacles close together (a gate or a staggered pair) are handled by the nearest one alone, so the swarm can be steered into the second one. The `gap < 10` push-off is the only protection from the others. The comment claims this avoids cancellation, but it just ignores the second obstacle. This is a likely failure case for "get the swarm through the obstacles".
3. `problems/flock/agent.ts`: the `room` lane check is computed around the obstacle's own `y` and ignores other obstacles. It can choose a lane that is wider but blocked by the next obstacle.
4. `problems/flock/agent.ts`: the swarm gets only a separation term (`d < 14`). There is no alignment or cohesion, and the neighbour push uses unexplained constants (14, 0.15). The agent may therefore scatter and lose agents at the edges. The `me.y < 15` / `me.y > height - 15` nudges are weak (0.5) next to the obstacle terms (up to 4).
5. `problems/flock/agent.ts`: the first loop computes the `dist`/`gap` values that the second loop recomputes, which is redundant. This is minor, and the loops could be merged.

I found no wrong-path edits, but I can't confirm criterion 1 from the diff, so I'm not giving LGTM.

### r2

CRITERIA:
- 1: uncertain — The diff has no score output, and I can't run the judge. The rollout steering is plausible, but it depends on judge constants I can't see here.
- 2: uncertain — Only `problems/flock/agent.ts` changes, so the path rule holds. I can't check the source rules in `judge/check.ts` from the diff. The file uses `Math.*` and type imports only, but I can't tell whether `Math` or the `world` argument are allowed.

PROBLEMS:
1. problems/flock/agent.ts: The pruning bound is invalid. The loop stops when `cost >= bestCost`, but `bestCost` already includes the `- 0.05 * x` progress credit, while the running `cost` doesn't. A candidate pruned at the cutoff could have won after its full-rollout credit. Worse, a truncated rollout falls through to `cost -= 0.05 * x` and the `cost < bestCost` check. It is then compared with full rollouts using a smaller `x` and fewer steps charged, so it can be picked as best. Subtract the progress credit inside the bound, or drop the early exit.
2. problems/flock/agent.ts: `SPEED = 4`, `TURN = 0.3` and the neighbour model `n.dx + SPEED*t*cos(n.heading)` are copied from the judge by guess. Nothing in the diff shows these match `judge/flock/world`. If the judge's speed or turn rate differs, or `neighbours` and `obstacles` are in a different frame, every rollout is wrong. Read the values from `world` if it exposes them, or confirm them against the judge.
3. problems/flock/agent.ts: `me.y` and `world.height` are used for the wall term. The diff doesn't show that `FlockAgent`'s `me` carries `y` or that `world` carries `height`. If they don't exist, `py` is NaN and the wall penalty never fires. If `me.y` is missing, `bun judge/check.ts` fails type-checking.
4. problems/flock/agent.ts: `if (obstacles.length === 0 && neighbours.length === 0) return 0;` makes an agent snap to heading 0 whenever nothing is in view. It ignores `me.heading`, and the turn-limited flight in the judge can make that a sharp change. Bias toward the current heading instead.
5. problems/flock/agent.ts: The `TN = 4` cap on neighbour lookahead and the constants (`W_NB = 500`, `W_OBS = 100`, `FAN = 1.6`) are untuned and unexplained. The fan also covers about ±92°, so some targets are never useful. Per-agent work is 17 × 22 × (obstacles + neighbours) per tick. If the judge has a time budget, this could trip it, and I can't see the budget.

## What the judge said, per rollout

### r1

```
✓ setup-1  exit 0  0.0s  bun install --frozen-lockfile
  ✗ verify   exit 1  2.5s  bun judge/check.ts flock --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
      flock: base -0.0287  head -1.4097  on seeds 3991536078, 3335940488, 1169854557
      {"problem":"flock","passed":false,"base":{"sha":"392c31ec3c0380d33ef15e64b86be0f9e7f3d102","mean":-0.028666666666666663,"runs":[{"seed":3991536078,"score":-0.008,"arrived":6,"died":194,"collisions":19},{"seed":3335940488,"score":-0.046,"arrived":0,"died":200,"collisions":23},{"seed":1169854557,"score":-0.032,"arrived":2,"died":198,"collisions":21}]},"head":{"sha":"b4e2d2bdf0eede59863d45374c5bd1f94268ae1d","mean":-1.4096666666666666,"runs":[{"seed":3991536078,"score":-1.31,"arrived":0,"died":198,"collisions":655},{"seed":3335940488,"score":-1.8330000000000002,"arrived":9,"died":191,"collisions":939},{"seed":1169854557,"score":-1.0859999999999999,"arrived":22,"died":175,"collisions":598}]},"seeds":[3991536078,3335940488,1169854557]}
  FAILED flock-get-the-swarm-through-the-obstacles-muweo1q4 at b4e2d2bdf0ee  (ratified: no, base 392c31ec3c03)
```

### r2

```
✓ setup-1  exit 0  0.0s  bun install --frozen-lockfile
  ✓ verify   exit 0  8.9s  bun judge/check.ts flock --base 392c31ec3c0380d33ef15e64b86be0f9e7f3d102
  ✓ gate-1   exit 0  8.8s  bun test --timeout 120000
  ✓ gate-2   exit 0  2.2s  bunx tsc --noEmit
  PASSED flock-get-the-swarm-through-the-obstacles-muweo1q4 at f420b19ab4b3  (ratified: no, base 392c31ec3c03)
```

## Why this one was submitted

r2 was the one rollout the judge passed; it became thompson/flock-get-the-swarm-through-the-obstacles-muweo1q4.

## Verdict on submit

- setup-1: exit 0
- verify: exit 0
- gate-1: exit 0
- gate-2: exit 0

## Indicators

- Gain per 10,000 model chars: 0.14 (gain 0.8800000000000001, cost 63020)
- Judge seconds per judged rollout: 11.2
- Commits at HEAD authored by the loop since a person last committed: 0 (0 advance(s); limit 6)
- Card kind: ordinary (adapters/, src/ refused)
- Record hashes: r1 85828493bbb0, r2 e6b5e35c39c8

## Next card

none written

## Files in this folder

- card.md
- attempts/r1/verdict.json
- attempts/r1/c2/continue.reply.md
- attempts/r1/c2/diff.patch
- attempts/r1/c2/correct.reply.md
- attempts/r1/c2/correct.prompt.md
- attempts/r1/c2/critique.prompt.md
- attempts/r1/c2/continue.prompt.md
- attempts/r1/c2/critique.reply.md
- attempts/r1/c1/diff.patch
- attempts/r1/c1/correct.reply.md
- attempts/r1/c1/generate.reply.md
- attempts/r1/c1/correct.prompt.md
- attempts/r1/c1/critique.prompt.md
- attempts/r1/c1/generate.prompt.md
- attempts/r1/c1/critique.reply.md
- attempts/r2/verdict.json
- attempts/r2/c2/continue.reply.md
- attempts/r2/c2/diff.patch
- attempts/r2/c2/correct.reply.md
- attempts/r2/c2/correct.prompt.md
- attempts/r2/c2/critique.prompt.md
- attempts/r2/c2/continue.prompt.md
- attempts/r2/c2/critique.reply.md
- attempts/r2/c1/diff.patch
- attempts/r2/c1/correct.reply.md
- attempts/r2/c1/generate.reply.md
- attempts/r2/c1/correct.prompt.md
- attempts/r2/c1/critique.prompt.md
- attempts/r2/c1/generate.prompt.md
- attempts/r2/c1/critique.reply.md
- run.md
