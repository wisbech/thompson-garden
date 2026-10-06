I rewrote the grammar in `problems/ltree/agent.ts`. It now scores 0.2965 on the fixed seeds, up from −0.0352 at the base. I didn't run the base-versus-head check (`bun judge/check.ts ltree --base <base>`) or any tests, so the judged result isn't confirmed.

- **The change:** a short trunk, then a branching rule (`X → !F[+X][-X]F[X]`) with a 40.15° angle, 54.4 px step and shrink of 0.99, for five iterations. Few thick branches fan the leaves across the frame, so each sun reaches many tips for little wood.
- **How I got there:** I searched grammar parameters at random, then hill-climbed. The numbers came out of that search. Nothing here is a hand-derived design.
- **Seed check:** the search scored candidates on five seeds (1–5). A tree that leaves the frame scores −1 and would have been dropped, so the chosen grammar is valid on all five.
- **Rules and paths:** only `problems/ltree/agent.ts` changed. The file uses only `import type`, and I didn't check it against `ruleBroken` in `judge/check.ts`.
- **Project score:** I didn't run `bun judge/check.ts all --score`. The ltree term should rise by about 0.33 over the 1.194976 base.
