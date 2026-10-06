I made no edits, because none of the four problems holds up against the judge code. `problems/ltree/agent.ts` is unchanged.

I read `judge/ltree/world.ts` and `judge/check.ts`. I also ran the judge's `run()` directly on seeds 1, 2 and 3, with a scratch script outside the repo. I did not run `check.ts` or any test suite.

1. **`!` is supported.** `walk()` handles it as "multiply the step by `shrink`". The middle shoot therefore works as the comment says.
2. **`shrink` is supported.** `Grammar` declares an optional `shrink` between 0.3 and 1, and `walk()` reads it. 0.94 is inside that range.
3. **No cap is hit.** The grammar stays inside every limit:
   - `iterations` is 7 and `step` is 60, which are the maximums.
   - The tree has 127 leaves, far below the 6000-segment cap.
   - The string is far below 400,000 symbols.
   - The root has exactly one trunk, because the axiom starts with a single `F`.
   - No branch leaves the frame; all three seeds score as valid.
4. **The score is higher on all three seeds.** Both runs below used seeds 1, 2 and 3:

   | | Seed 1 | Seed 2 | Seed 3 |
   |---|---|---|---|
   | Base | -0.045 | -0.031 | -0.029 |
   | This grammar | 0.278 | 0.279 | 0.293 |

   The grammar scores about 0.3 higher on every seed, so a single fixed grammar does generalise here.

The agent also keeps to the source rules in `check.ts`: it has only a type import and no forbidden identifiers. Only `problems/ltree/` changed, with no protected path touched.
