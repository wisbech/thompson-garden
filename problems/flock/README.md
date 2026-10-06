# Flock

Proposed, not built. No judge yet; it is written by hand, by a person, when this problem is picked.

Two hundred agents cross an obstacle field placed from the commit (Reynolds' boids, M_1_5's agents).

**The agent (yours).** A steering function that sees neighbours and obstacles within a radius. The judge owns speed, turning and collisions.

**The check.** The run finishes inside the budget.

**The score.** Share of agents arriving within T steps, minus a penalty per collision.

Full proposal: the project's `visual-problems/visual-problems.md`.
