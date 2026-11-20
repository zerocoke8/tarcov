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
   * 화면에서 가리킨 방향 그대로 움직이게 하는 월드 방향 (단위 벡터)을 out 에 넣는다. 터치 패드에 쓴다.
   * 마름모 화면은 바닥이 세로로 절반 눌려 보이므로, 화면에서의 방향을 바닥 위의 방향으로 되돌려야 가리킨 쪽으로 간다.
   * (길은 화면에서 비스듬히 약 27도로 놓여 있고, 패드를 그 각도로 밀면 길을 따라 걷는다)
   */
  worldDir(dx: number, dy: number, out: { x: number; y: number }): void {
    let x = dx;
    let y = dy;
    if (this.iso) {
      // 화면 벡터 (dx, dy) = ((x - y)·A, (x + y)·B) 를 푼 것
      x = dx / (2 * ISO_A) + dy / (2 * ISO_B);
      y = dy / (2 * ISO_B) - dx / (2 * ISO_A);
    }
    const len = Math.hypot(x, y) || 1;
    out.x = x / len;
    out.y = y / len;
  }

  /**
   * 8방향 조작(키보드)의 방향(화면 기준) → 월드 방향. 마름모 화면은 카메라가 45도 돌아가 있으므로 그만큼 돌린다.
   * 대각선이 바닥 격자의 줄(길이 나 있는 방향)과 나란해진다. 여덟 방향밖에 없는 조작에서 길을 따라 걸을 수 있게 하려는 것이다
   */
  inputX(dx: number, dy: number): number {
    return this.iso ? (dx + dy) * Math.SQRT1_2 : dx;
  }

  inputY(dx: number, dy: number): number {
    return this.iso ? (dy - dx) * Math.SQRT1_2 : dy;
  }
}

export const proj = new Projection();
