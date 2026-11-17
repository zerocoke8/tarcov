export const TAU = Math.PI * 2;

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const dist = (ax: number, ay: number, bx: number, by: number): number => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};
export const deg = (d: number): number => (d * Math.PI) / 180;

/** a에서 b로 가는 최소 회전각 (-PI ~ PI) */
export function angDiff(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d < -Math.PI) d += TAU;
  return d;
}

export const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

/** '#rrggbb' → 0xrrggbb */
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function numToHex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/** 색을 어둡게(amount<0) 또는 밝게(amount>0). amount는 -1 ~ 1 */
export function shade(color: number, amount: number): number {
  let r = (color >> 16) & 255;
  let g = (color >> 8) & 255;
  let b = color & 255;
  if (amount >= 0) {
    r += (255 - r) * amount;
    g += (255 - g) * amount;
    b += (255 - b) * amount;
  } else {
    r *= 1 + amount;
    g *= 1 + amount;
    b *= 1 + amount;
  }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
