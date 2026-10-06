import { expect, test } from "bun:test";
import { problems, scoreModule } from "./problems";
import * as slime from "./slime/world";
import * as web from "./web/world";
import * as flock from "./flock/world";
import * as canopy from "./canopy/world";
import * as ltree from "./ltree/world";

for (const name of ["slime", "web", "flock", "canopy", "ltree"]) {
  test(`${name}: the baseline runs, repeats exactly, and scores a finite number`, async () => {
    const p = problems[name], mod = await import(`../${p.agent}`);
    const a = scoreModule(p, mod, [4]), b = scoreModule(p, mod, [4]);
    expect(Number.isFinite(a.mean)).toBe(true);
    expect(a.mean).toBe(b.mean);
  }, 60_000);
}

test("slime: one lean path between two foods scores near 0.1 + 1, a blob far less, a gap a tenth", () => {
  const foods: [number, number][] = [[20, 60], [120, 60]];
  const line = new Float32Array(slime.W * slime.H);
  for (let x = 20; x <= 120; x++) line[60 * slime.W + x] = 5;
  const lean = slime.measure(line, foods);
  expect(lean.connected).toBe(true);
  expect(lean.score).toBeGreaterThan(1.05);
  const blob = new Float32Array(slime.W * slime.H).fill(5);
  expect(slime.measure(blob, foods).score).toBeLessThan(0.11);
  line[60 * slime.W + 70] = 0;
  expect(slime.measure(line, foods).score).toBe(0);
});

test("web: crossings and overlaps are counted", () => {
  const pos = Float64Array.from([0, 0, 100, 100, 0, 100, 100, 0, 300, 300, 305, 300]);
  const r = web.measure(pos, [[0, 1], [2, 3], [4, 5]]);
  expect(r.crossings).toBe(1);
  expect(r.overlaps).toBe(1);
  expect(web.graphFor(9).edges.length).toBeGreaterThan(60);
});

test("web: the judge limits each move and keeps nodes in the frame", () => {
  const r = web.run({ forces: (p) => new Float64Array(p.length).fill(1e9) }, 1, 5_000);
  for (let i = 0; i < r.positions.length; i += 2) {
    expect(r.positions[i]).toBeLessThanOrEqual(web.WIDTH - web.MARGIN);
    expect(r.positions[i + 1]).toBeLessThanOrEqual(web.HEIGHT - web.MARGIN);
  }
});

test("flock: agents that fly into an obstacle stop, and nobody beats the speed limit", () => {
  const r = flock.run({ steer: () => 0 }, 2, 10_000);
  expect(r.arrived + r.died).toBeLessThanOrEqual(flock.AGENTS);
  for (const path of r.paths) for (let k = 1; k < path.length; k++)
    expect(Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1])).toBeLessThanOrEqual(4 * flock.SPEED + 1e-6);
});

test("canopy: a tree must start at the root, stay in the frame and never cross itself", () => {
  const ok = [{ x: 400, y: 600, parent: -1 }, { x: 400, y: 500, parent: 0 }, { x: 350, y: 450, parent: 1 }, { x: 450, y: 450, parent: 1 }];
  expect(canopy.validate(ok)).toBe("");
  expect(canopy.validate([{ x: 10, y: 10, parent: -1 }, { x: 20, y: 20, parent: 0 }])).toContain("root");
  expect(canopy.validate([...ok, { x: 400, y: 700, parent: 2 }])).toContain("outside");
  const crossing = [...ok, { x: 470, y: 420, parent: 2 }, { x: 330, y: 420, parent: 3 }];
  expect(canopy.validate(crossing)).toContain("cross");
  expect(canopy.measure(crossing, [0]).score).toBe(-1);
});

test("canopy: more wood for the same light scores lower", () => {
  const short = canopy.measure([{ x: 400, y: 600, parent: -1 }, { x: 400, y: 500, parent: 0 }], [0]);
  const tall = canopy.measure([{ x: 400, y: 600, parent: -1 }, { x: 400, y: 100, parent: 0 }], [0]);
  expect(short.light).toBe(tall.light);
  expect(short.score).toBeGreaterThan(tall.score);
});

test("agent rules: type imports pass; real imports, process access and patched built-ins fail", async () => {
  const { ruleBroken } = await import("./check");
  for (const name of Object.keys(problems)) expect(ruleBroken(await Bun.file(problems[name].agent).text())).toBeNull();
  expect(ruleBroken(`import type { X } from "../../judge/x";\n// import fs from "fs"\nexport const a = 1;`)).toBeNull();
  expect(ruleBroken(`import { problems } from "../../judge/problems";`)).not.toBeNull();
  expect(ruleBroken(`const m = await import("x");`)).not.toBeNull();
  expect(ruleBroken(`Math.hypot = () => 0;`)).not.toBeNull();
  expect(ruleBroken(`if (Math.random === x) {}`)).toBeNull();
  expect(ruleBroken(`process.exit(0)`)).not.toBeNull();
});

test("ltree: the turtle draws one node per F, branches with [ ], and the root needs one trunk", () => {
  const g = { axiom: "F[+F][-F]", rules: {}, iterations: 0, angle: 90, step: 10 };
  const n = ltree.walk(g, ltree.rewrite(g));
  expect(n.length).toBe(4);
  expect(n[2].parent).toBe(1);
  expect(n[3].parent).toBe(1);
  expect(Math.round(n[2].x)).toBe(410);
  expect(ltree.measure(n, [0]).valid).toBe(true);
  const fan = ltree.walk({ ...g, axiom: "[+F][-F]" }, "[+F][-F]");
  expect(ltree.measure(fan, [0]).reason).toContain("trunk");
});

test("ltree: understory leaves catch nothing, runaway grammars are refused", () => {
  const low = ltree.measure([{ x: 400, y: 600, parent: -1 }, { x: 400, y: 560, parent: 0 }], [0]);
  const high = ltree.measure([{ x: 400, y: 600, parent: -1 }, { x: 400, y: 300, parent: 0 }], [0]);
  expect(low.light).toBe(0);
  expect(high.light).toBeGreaterThan(0);
  const r = ltree.run({ grammar: () => ({ axiom: "F", rules: { F: "FFFFFFFFFF" }, iterations: 7, angle: 0, step: 1 }) }, 1, 1000);
  expect(r.valid).toBe(false);
  expect(r.score).toBe(-1);
});
