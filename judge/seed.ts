// Seeds for a judged run, derived from the commit under judgement, so an agent tuned to a
// world it has seen meets a world it has not.
import { createHash } from "node:crypto";

export function seedsFor(sha: string, n: number): number[] {
  return Array.from({ length: n }, (_, i) => createHash("sha256").update(`${sha}:${i}`).digest().readUInt32BE(0) || 1);
}
