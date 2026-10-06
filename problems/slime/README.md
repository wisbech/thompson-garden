# Slime

Proposed, not built. No judge yet; it is written by hand, by a person, when this problem is picked.

Physarum agents (Jones 2010) grow a transport network between food sources the judge places from the commit.

**The agent (yours).** The agent rule only: sensor angle and distance, turn rule, deposit amount. The judge owns the grid, diffusion, decay and food.

**The check.** After a fixed number of steps the thresholded trail map must connect every food source.

**The score.** Spanning-tree length over network length. A minimum spanning tree scores 1.0; a Steiner tree reaches about 1.15.

Full proposal: the project's `visual-problems/visual-problems.md`.
