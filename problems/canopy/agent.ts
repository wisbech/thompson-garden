// The Canopy agent: the program that grows the tree. The only file a Canopy card changes.
// Self-contained: type imports only.
import type { CanopyAgent, Node } from "../../judge/canopy/world";

// Baseline, after M_5_1_01's recursive branching: a symmetric binary tree, seven levels of branches,
// each 0.6 of its parent and 0.8 rad (about 46 degrees) to either side; narrower or longer ones cross.
export const grow: CanopyAgent["grow"] = (world) => {
  const nodes: Node[] = [{ x: world.root[0], y: world.root[1], parent: -1 }];
  const branch = (parent: number, angle: number, length: number, depth: number) => {
    const p = nodes[parent];
    nodes.push({ x: p.x + Math.sin(angle) * length, y: p.y - Math.cos(angle) * length, parent });
    const me = nodes.length - 1;
    if (depth === 0) return;
    branch(me, angle - 0.8, length * 0.6, depth - 1);
    branch(me, angle + 0.8, length * 0.6, depth - 1);
  };
  branch(0, 0, 150, 6);
  return nodes;
};
