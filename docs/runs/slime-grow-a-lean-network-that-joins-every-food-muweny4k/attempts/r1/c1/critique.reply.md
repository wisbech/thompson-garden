CRITERIA:
- 1: uncertain. The diff only retunes constants (sensorAngle 0.9, sensorDistance 15, stepSize 2). It has no score, no run of `bun judge/check.ts slime --base <base>`, and nothing showing the result beats the base on the three seeded worlds. The comment claims scattered strands will pull into a few joined lines, but that claim is untested. A doubled step and a longer sensor reach can also make agents overshoot food and smear into thick bands, which would lower the score.
- 2: uncertain. The only touched path is `problems/slime/agent.ts`, so the first half passes. I can't confirm the second half, because the diff doesn't show whether `judge/check.ts` limits `sensorAngle`, `sensorDistance` or `stepSize`. Moving all three away from the baseline values risks breaking a range or rule I can't see.

PROBLEMS:
1. problems/slime/agent.ts: Nothing in the diff justifies the change. There is no evidence of a higher score, and the rationale in the comment is only asserted. Run the judge against the base and include the three-world scores before accepting it.
2. problems/slime/agent.ts: Three parameters changed together, so even a gain can't be traced to any one of them. `stepSize: 2` doubles the speed, so agents can skip over thin trails and food cells while depositing coarsely. Test `stepSize` separately and consider keeping it at 1.
3. problems/slime/agent.ts: The `0.9` in `turn` is a second hardcoded copy of `sensorAngle`. If one is edited without the other, the steering angle and the sensor geometry drift apart. Derive it from `params.sensorAngle`.
4. problems/slime/agent.ts: The `turn` logic is unchanged, so nothing in the diff adds a mechanism that joins every food or keeps the network lean. It is parameter tuning with a comment that claims more than it does.
