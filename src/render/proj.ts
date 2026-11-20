// 월드 좌표(규칙 코드가 쓰는 네모 격자)를 화면에 놓는 방식.
//
//   flat  기존 화면. 비스듬한 탑다운: 화면 좌표 = 월드 좌표이고, 높이만큼 위로 올려 그린다.
//   iso   마름모(아이소메트릭 2:1). 카메라가 45도 돌아가 비스듬히 내려다본다:
//         월드 +x 는 화면 오른쪽 아래로, +y 는 화면 왼쪽 아래로 간다. 네모 칸이 가로 2 : 세로 1 의 마름모로 보인다.
//
// 규칙 코드는 어느 쪽이든 같은 월드 좌표로 움직인다. 표시부만 이 파일을 거쳐 화면 좌표를 구한다.
// (PixiJS 를 쓰지 않는 순수 계산이라 화면 없이 검사할 수 있다)

/** 월드 1px 이 화면 가로·세로로 가는 거리. 화면에서 좌우로 걷는 빠르기가 기존 화면과 같도록 1/√2 로 잡았다 */
export const ISO_A = Math.SQRT1_2;
export const ISO_B = ISO_A / 2;

export type ViewMode = 'flat' | 'iso';

class Projection {
  iso = false;

  /** 화면 방식을 고른다 (섹터에 들어갈 때) */
  use(mode: ViewMode): void {
    this.iso = mode === 'iso';
  }

  /** 바닥의 한 점 → 화면(월드 층) 좌표 */
  x(wx: number, wy: number): number {
    return this.iso ? (wx - wy) * ISO_A : wx;
  }

  y(wx: number, wy: number): number {
    return this.iso ? (wx + wy) * ISO_B : wy;
  }

  /** 앞뒤 순서: 화면에서 아래에 있을수록 앞에 그린다 */
  depth(wx: number, wy: number): number {
    return this.iso ? (wx + wy) * ISO_B : wy;
  }

  /** 바닥 위의 방향 벡터 → 화면 벡터 */
  vx(dx: number, dy: number): number {
    return this.iso ? (dx - dy) * ISO_A : dx;
  }

  vy(dx: number, dy: number): number {
    return this.iso ? (dx + dy) * ISO_B : dy;
  }

  /** 바닥 위의 방향(rad) → 화면에서의 방향 */
  angle(a: number): number {
    if (!this.iso) return a;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return Math.atan2((c + s) * ISO_B, (c - s) * ISO_A);
  }

  /**
   * 바닥에 눕혀 그리는 층(바닥·범위 표시)에 거는 변환 [a, b, c, d]: 화면 x = a·x + c·y, 화면 y = b·x + d·y.
   * 이 변환이 걸린 층 안에서는 월드 좌표를 그대로 쓰면 된다
   */
  get ground(): [number, number, number, number] {
    return this.iso ? [ISO_A, ISO_B, -ISO_A, ISO_B] : [1, 0, 0, 1];
  }

  /**
   * 눕혀 그리는 층 안에서 높이 h 만큼 떠 보이게 하려면 좌표를 얼마나 옮겨야 하는지.
   * (그 층은 통째로 기울어 있어, 화면에서 위로 올리려면 x 와 y 를 함께 줄여야 한다)
   */
  liftX(h: number): number {
    return this.iso ? -h / (2 * ISO_B) : 0;
  }

  liftY(h: number): number {
    return this.iso ? -h / (2 * ISO_B) : -h;
  }

  /** 화면에서 가로로 d 만큼 떨어진 바닥의 점까지의 월드 이동량 */
  sideX(d: number): number {
    return this.iso ? d / (2 * ISO_A) : d;
  }

  sideY(d: number): number {
    return this.iso ? -d / (2 * ISO_A) : 0;
  }

  /**
   * 조작 방향(화면 기준) → 월드 방향. 마름모 화면은 카메라가 45도 돌아가 있으므로 그만큼 돌린다.
   * D패드의 대각선이 바닥 격자의 줄(길이 나 있는 방향)과 나란해진다
   */
  inputX(dx: number, dy: number): number {
    return this.iso ? (dx + dy) * Math.SQRT1_2 : dx;
  }

  inputY(dx: number, dy: number): number {
    return this.iso ? (dy - dx) * Math.SQRT1_2 : dy;
  }
}

export const proj = new Projection();
