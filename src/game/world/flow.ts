// 몬스터 길찾기용 흐름장: 플레이어가 있는 칸에서 모든 칸까지의 걸음 수를 구해 두고,
// 몬스터는 걸음 수가 줄어드는 이웃 칸으로 이동한다.
import { TILE } from './layout';
import { solidAt, type Grid } from './collision';

const NEIGHBORS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export class FlowField {
  private dist: Int32Array;
  private queue: Int32Array;
  private goal = -1;

  constructor(private grid: Grid) {
    this.dist = new Int32Array(grid.w * grid.h).fill(-1);
    this.queue = new Int32Array(grid.w * grid.h);
  }

  /** 목표 지점이 다른 칸으로 옮겨졌을 때만 다시 계산한다 */
  compute(px: number, py: number): void {
    const { w, h, solid } = this.grid;
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return;
    const goal = ty * w + tx;
    if (goal === this.goal) return;
    this.goal = goal;
    const d = this.dist;
    d.fill(-1);
    const q = this.queue;
    let head = 0;
    let tail = 0;
    d[goal] = 0;
    q[tail++] = goal;
    while (head < tail) {
      const i = q[head++];
      const x = i % w;
      const nd = d[i] + 1;
      if (x > 0 && !solid[i - 1] && d[i - 1] < 0) {
        d[i - 1] = nd;
        q[tail++] = i - 1;
      }
      if (x < w - 1 && !solid[i + 1] && d[i + 1] < 0) {
        d[i + 1] = nd;
        q[tail++] = i + 1;
      }
      if (i >= w && !solid[i - w] && d[i - w] < 0) {
        d[i - w] = nd;
        q[tail++] = i - w;
      }
      if (i < w * (h - 1) && !solid[i + w] && d[i + w] < 0) {
        d[i + w] = nd;
        q[tail++] = i + w;
      }
    }
  }

  /** (x, y)에서 목표로 가는 방향을 out에 단위 벡터로 넣는다. 길이 없거나 이미 목표 칸이면 false */
  dir(x: number, y: number, out: { x: number; y: number }): boolean {
    const { w } = this.grid;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (solidAt(this.grid, tx, ty)) return false;
    const here = this.dist[ty * w + tx];
    if (here <= 0) return false;
    let best = here;
    let bx = 0;
    let by = 0;
    for (const [dx, dy] of NEIGHBORS) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (solidAt(this.grid, nx, ny)) continue;
      // 대각선은 양옆이 모두 뚫려 있을 때만 (모서리에 끼지 않도록)
      if (dx !== 0 && dy !== 0 && (solidAt(this.grid, tx + dx, ty) || solidAt(this.grid, tx, ty + dy))) continue;
      const d = this.dist[ny * w + nx];
      if (d >= 0 && d < best) {
        best = d;
        bx = dx;
        by = dy;
      }
    }
    if (bx === 0 && by === 0) return false;
    const gx = (tx + bx + 0.5) * TILE - x;
    const gy = (ty + by + 0.5) * TILE - y;
    const len = Math.hypot(gx, gy) || 1;
    out.x = gx / len;
    out.y = gy / len;
    return true;
  }
}
