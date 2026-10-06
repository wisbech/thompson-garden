I rewrote `problems/ltree/agent.ts` to fix the four problems. I haven't run `bun judge/check.ts ltree --base <base>`. I did score it with a small script that calls the judge's `run()` on seeds 1, 2 and 3. Those seeds are not the commit-seeded worlds the check uses.

- **`shrink`:** It is a legal field. `Grammar` in `judge/ltree/world.ts` has `shrink?` (0.3 to 1), but it only takes effect through the `!` symbol. The old rules never used `!`, so the field did nothing and every segment stayed at length 60. I added `!` to the rule: `A -> !F[+A][-A]`.
- **Caps:** The old grammar would likely have run out of frame, which scores -1. The new one uses 7 iterations (the cap), step 60 (the cap) and about 128 branches. It stays inside the frame and the segment limit on seeds 1 to 3.
- **Angle:** I swept it over 20 to 40 degrees and settled on 30. At 30° with `shrink: 0.9`, seeds 1, 2 and 3 score 0.246, 0.249 and 0.243. The baseline scores -0.045, -0.031 and -0.029 on the same seeds. The comment now describes this sweep.
- **Trunk:** The baseline's `F: "FF"` thickening rule is dropped on purpose. The judge already thickens branches by pipe-model area, so doubling `F` only adds wood. The single `F` before `A` gives the one trunk the judge requires.

Snags:
- A wider sweep (including `shrink` 0.93 at 26°, about 0.26) scored slightly higher, but I kept 0.9 at 30° as the safer choice.
- My first sweep timed out in the shell, and the Monitor I set to watch it expired without output. I re-ran a smaller sweep instead.
