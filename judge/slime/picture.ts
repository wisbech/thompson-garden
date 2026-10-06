import { png } from "../png";
import { H, THRESHOLD, W, type SlimeResult } from "./world";

export function picture(r: SlimeResult): Buffer {
  const S = 4, rgb = new Uint8Array(W * S * H * S * 3);
  for (let y = 0; y < H * S; y++) for (let x = 0; x < W * S; x++) {
    const c = Math.floor(y / S) * W + Math.floor(x / S), v = Math.min(1, r.trail[c] / (THRESHOLD * 2));
    const o = (y * W * S + x) * 3, net = r.network[c];
    rgb[o] = 250 - v * 200 - (net ? 30 : 0); rgb[o + 1] = 251 - v * 120 - (net ? 20 : 0); rgb[o + 2] = 248 - v * 150 - (net ? 20 : 0);
  }
  for (const [fx, fy] of r.foods) for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    if (dx * dx + dy * dy > 36) continue;
    const x = fx * S + 2 + dx, y = fy * S + 2 + dy;
    if (x < 0 || y < 0 || x >= W * S || y >= H * S) continue;
    const o = (y * W * S + x) * 3; rgb[o] = 154; rgb[o + 1] = 107; rgb[o + 2] = 12;
  }
  return png(W * S, H * S, rgb);
}
