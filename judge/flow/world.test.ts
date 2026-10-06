import { expect, test } from "bun:test";
import { makeField, minSeparation, run, SPACING, coverage, type FlowAgent } from "./world";
import { seedsFor } from "../seed";
import { scoreAgent } from "./check";

const randomStarts: FlowAgent = {
  nextSeed: (w) => (w.missesInARow >= 400 ? null : [w.random() * w.width, w.random() * w.height]),
};

test("the field is the same for the same seed and differs between seeds", () => {
  const a = makeField(7), b = makeField(7), c = makeField(8);
  for (const [x, y] of [[0, 0], [123.4, 456.7], [999, 599]]) expect(a(x, y)).toBe(b(x, y));
  expect(a(500, 300)).not.toBe(c(500, 300));
});

test("seeds come from the commit and repeat", () => {
  expect(seedsFor("abc", 3)).toEqual(seedsFor("abc", 3));
  expect(seedsFor("abc", 3)).not.toEqual(seedsFor("abd", 3));
});

test("a run repeats exactly for the same seed", () => {
  const a = run(randomStarts, 5, 10_000), b = run(randomStarts, 5, 10_000);
  expect(a.trails.length).toBe(b.trails.length);
  expect(a.coverage).toBe(b.coverage);
});

test("no two trails come closer than half a spacing", () => {
  const r = run(randomStarts, 11, 10_000);
  expect(r.trails.length).toBeGreaterThan(20);
  expect(minSeparation(r.trails)).toBeGreaterThanOrEqual(SPACING / 2 - 1e-9);
});

test("seeds that are bad or crowded are refused, and a null ends the run", () => {
  let n = 0;
  const bad: FlowAgent = { nextSeed: () => (n++ < 5 ? [NaN, -1] : null) };
  const r = run(bad, 1, 1_000);
  expect(r.trails).toEqual([]);
  expect(r.cut).toBe("agent");
  expect(coverage([])).toBe(0);
});

test("the budget cuts an agent that never stops", () => {
  const forever: FlowAgent = { nextSeed: () => [-1, -1] };
  expect(["budget", "calls"]).toContain(run(forever, 1, 200).cut);
});

test("the baseline scores between 0 and 1", () => {
  const s = scoreAgent(randomStarts, [1]).mean;
  expect(s).toBeGreaterThan(0.3);
  expect(s).toBeLessThan(1);
});
