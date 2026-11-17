// 칸 격자와 원(캐릭터·몬스터·투사체)의 충돌 처리
import { clamp } from '../../core/math';
import { TILE } from './layout';

export interface Grid {
  w: number;
  h: number;
  solid: Uint8Array;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/** 맵 밖은 막힌 것으로 본다 */
export function solidAt(g: Grid, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= g.w || ty >= g.h) return true;
  return g.solid[ty * g.w + tx] === 1;
}

export function solidAtPx(g: Grid, x: number, y: number): boolean {
  return solidAt(g, Math.floor(x / TILE), Math.floor(y / TILE));
}

/** 막힌 칸과 겹친 원을 밖으로 밀어낸다 */
export function resolveCircle(g: Grid, b: Circle): void {
  for (let pass = 0; pass < 2; pass++) {
    const minTx = Math.floor((b.x - b.r) / TILE);
    const maxTx = Math.floor((b.x + b.r) / TILE);
    const minTy = Math.floor((b.y - b.r) / TILE);
    const maxTy = Math.floor((b.y + b.r) / TILE);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (!solidAt(g, tx, ty)) continue;
        const left = tx * TILE;
        const top = ty * TILE;
        const nx = clamp(b.x, left, left + TILE);
        const ny = clamp(b.y, top, top + TILE);
        const dx = b.x - nx;
        const dy = b.y - ny;
        const d2 = dx * dx + dy * dy;
        if (d2 >= b.r * b.r) continue;
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = b.r - d;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        } else {
          // 중심이 칸 안에 들어간 경우: 막히지 않은 가장 가까운 변으로 밀어낸다
          const options: [number, number, number][] = [];
          if (!solidAt(g, tx - 1, ty)) options.push([b.x - left, -1, 0]);
          if (!solidAt(g, tx + 1, ty)) options.push([left + TILE - b.x, 1, 0]);
          if (!solidAt(g, tx, ty - 1)) options.push([b.y - top, 0, -1]);
          if (!solidAt(g, tx, ty + 1)) options.push([top + TILE - b.y, 0, 1]);
          if (!options.length) continue;
          options.sort((a, c) => a[0] - c[0]);
          const [depth, ox, oy] = options[0];
          b.x += ox * (depth + b.r);
          b.y += oy * (depth + b.r);
        }
      }
    }
  }
}

/** 원을 (dx, dy)만큼 움직인다. 빠른 이동도 벽을 뚫지 않게 잘게 나눠 처리한다. */
export function moveCircle(g: Grid, b: Circle, dx: number, dy: number): void {
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const steps = Math.max(1, Math.ceil(len / Math.max(4, b.r * 0.8)));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    b.x += sx;
    b.y += sy;
    resolveCircle(g, b);
  }
}

/** 두 점 사이가 벽이나 오브젝트에 가려지지 않았는지 */
export function lineOfSight(g: Grid, x1: number, y1: number, x2: number, y2: number): boolean {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(len / 16);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (solidAtPx(g, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

/** 점 (px, py)에서 선분 (x1,y1)-(x2,y2)까지의 거리 */
export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1) : 0;
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

/** 막히지 않은 가장 가까운 칸의 중심을 찾는다 (몬스터·상자를 놓을 때 사용) */
export function nearestFree(g: Grid, x: number, y: number): { x: number; y: number } {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (!solidAt(g, tx, ty)) return { x, y };
  for (let r = 1; r < 6; r++) {
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        if (!solidAt(g, tx + i, ty + j)) return { x: (tx + i + 0.5) * TILE, y: (ty + j + 0.5) * TILE };
      }
    }
  }
  return { x, y };
}
