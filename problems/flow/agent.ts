// The Flow agent: where the next trail starts. This is the only file a Flow card changes.
// It must stay self-contained (type imports only), because the check also loads the base's copy alone.
import type { FlowWorld, Point } from "../../judge/flow/world";

// Baseline: start anywhere at random; stop after 400 misses in a row.
export function nextSeed(world: FlowWorld): Point | null {
  if (world.missesInARow >= 400) return null;
  return [world.random() * world.width, world.random() * world.height];
}
