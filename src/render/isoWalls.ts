// 마름모(아이소메트릭) 화면에서 벽을 얼마나 높이 세울지 정한다. 화면을 그리지 않는 순수 계산이다 (tests/iso.test.ts).
//
// 마름모 화면은 맵을 비스듬히 내려다보므로, 벽을 높이 세우면 그 뒤(화면 위쪽)에 있는 것을 가린다.
// 그래서 벽마다 높이를 다르게 한다.
//  - 높은 벽: 뒤쪽으로 걸어 다니는 바닥이 없는 벽. 방의 뒷벽이 되어 입체감을 준다.
//  - 낮은 벽: 뒤쪽 가까이에 바닥이 있는 벽. 높이 세우면 그 바닥의 캐릭터와 몬스터를 가리므로 낮게 자른다.
//             바닥 둘레의 테두리만 세우고, 그보다 먼 앞쪽은 세우지 않는다 (어둡게 깔린 먼 땅으로 보인다).
// 맵 바깥도 벽으로 본다. 바닥에서 멀리 떨어진 벽은 화면에 거의 들어오지 않으므로 세우지 않는다.
import { TILE } from '../game/world/layout';
import { ISO_A, ISO_B } from './proj';

/** 한 칸 옆으로 갈 때 화면에서 가로·세로로 움직이는 거리 */
export const ISO_SX = TILE * ISO_A;
export const ISO_SY = TILE * ISO_B;
/** 벽의 높이 (화면 px): [세우지 않음, 낮은 벽, 높은 벽] */
export const ISO_LIFT = [0, 26, 112];
/** 바닥에서 이 거리(칸) 안의 벽만 입체로 세운다 */
export const ISO_REACH = 6;
/** 낮게 자른 벽은 바닥에서 이 거리(칸)까지만 세운다 */
export const ISO_RIM = 2;
/** 이 걸음 수 안에서 뒤쪽(화면 위쪽)에 바닥이 있으면 낮은 벽으로 자른다 */
const CUT_RANGE = 14;

export interface IsoWalls {
  /** 그 칸이 걸어 다니는 바닥인지 (고정 장애물이 놓인 칸도 바닥이다) */
  floorAt(x: number, y: number): boolean;
  /** 그 칸의 벽 높이 단계: 0 세우지 않음(바닥이거나 먼 곳), 1 낮은 벽, 2 높은 벽 */
  at(x: number, y: number): number;
  /** 가장 가까운 바닥까지의 칸 수 (대각선도 한 칸). ISO_REACH 보다 멀면 255 */
  far(x: number, y: number): number;
  /**
   * 화면에서 그 칸의 뒤쪽(위쪽)으로 k 걸음 안에 바닥이 있는지.
   * wide = 좌우로 몇 줄까지 볼지 (1이면 그 칸과 화면에서 겹쳐 보이는 줄만)
   */
  floorBehind(x: number, y: number, k: number, wide?: number): boolean;
}

/**
 * @param base 칸별 지형 (1 = 벽). MapLayout.base 와 같은 것
 */
export function buildIsoWalls(w: number, h: number, base: Uint8Array): IsoWalls {
  const floorAt = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && base[y * w + x] !== 1;

  // 화면에서 한 걸음 뒤 = x + y 가 1 줄어드는 것. 화면에서 같은 세로줄 = x - y 가 같은 것
  const floorBehind = (x: number, y: number, k: number, wide = 1): boolean => {
    for (let dd = 1; dd <= k; dd++) {
      for (let du = -wide; du <= wide; du++) {
        if ((dd + du) & 1) continue;
        if (floorAt(x + (du - dd) / 2, y - (dd + du) / 2)) return true;
      }
    }
    return false;
  };

  const X0 = -ISO_REACH;
  const Y0 = -ISO_REACH;
  const GW = w + ISO_REACH * 2;
  const GH = h + ISO_REACH * 2;
  const dist = new Uint8Array(GW * GH).fill(255);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!floorAt(x, y)) continue;
      for (let j = -ISO_REACH; j <= ISO_REACH; j++) {
        const row = (y + j - Y0) * GW;
        for (let i = -ISO_REACH; i <= ISO_REACH; i++) {
          const d = Math.max(Math.abs(i), Math.abs(j));
          const k = row + (x + i - X0);
          if (d < dist[k]) dist[k] = d;
        }
      }
    }
  }
  const level = new Uint8Array(GW * GH);
  for (let y = Y0; y < Y0 + GH; y++) {
    for (let x = X0; x < X0 + GW; x++) {
      const i = (y - Y0) * GW + (x - X0);
      if (dist[i] === 0 || dist[i] > ISO_REACH) continue;
      if (floorBehind(x, y, CUT_RANGE)) level[i] = dist[i] <= ISO_RIM ? 1 : 0;
      else level[i] = 2;
    }
  }
  const inside = (x: number, y: number): boolean => x >= X0 && y >= Y0 && x < X0 + GW && y < Y0 + GH;
  return {
    floorAt,
    floorBehind,
    at: (x, y) => (inside(x, y) ? level[(y - Y0) * GW + (x - X0)] : 0),
    far: (x, y) => (inside(x, y) ? dist[(y - Y0) * GW + (x - X0)] : 255),
  };
}
