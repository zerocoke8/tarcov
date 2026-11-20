// 교체 연출의 움직임 곡선 (기획서 3.7절). 시간의 진행(0~1)을 받아 위치·투명도·확대 정도를 돌려주는 순수 계산이다.
// 그리는 쪽은 WorldView 가 한다. 화면 없이 검사할 수 있게 그리기 라이브러리를 쓰지 않는다.

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 달려 들어오는 캐릭터: 제자리까지 남은 거리의 비율. 빠르게 다가와 멈춘다 (k = 들어오기 시작한 뒤의 진행 0~1) */
export function enterLeft(k: number): number {
  return (1 - clamp01(k)) ** 3;
}

/** 달려 들어오는 캐릭터의 불투명도 */
export function enterAlpha(k: number): number {
  return Math.min(1, 0.2 + clamp01(k) * 2.4);
}

/** 뛰어올라 나가는 캐릭터: 솟은 높이의 비율. 박차고 오른 뒤 느려진다 (u = 뛰어오른 뒤의 진행 0~1) */
export function leapUp(u: number): number {
  return 1 - (1 - clamp01(u)) ** 2.2;
}

/** 뛰어올라 나가는 캐릭터의 불투명도: 처음에는 또렷하다가 높이 오르면서 사라진다 */
export function leapAlpha(u: number): number {
  const v = clamp01(u);
  return v < 0.3 ? 1 : (1 - (v - 0.3) / 0.7) ** 1.5;
}

/**
 * 화면 확대 정도 (0~1). 새 캐릭터가 들어오는 동안 차오르고, 제자리에 선 순간 가장 크고, 그 뒤 풀린다.
 * @param enterK   들어오는 진행 (1 이상이면 이미 섰다)
 * @param sinceLand 선 뒤로 지난 시간(초)
 * @param release  다 풀릴 때까지의 시간(초)
 */
export function punchAmount(enterK: number, sinceLand: number, release = 0.26): number {
  if (enterK < 1) return clamp01(enterK) ** 2;
  return (1 - clamp01(sinceLand / release)) ** 2;
}

/**
 * 진행 k 까지 남겼어야 하는 잔상의 수. count 장을 from~to 구간에 고르게 남긴다
 * (예: 3장을 0.1~0.7 에 → 0.1, 0.4, 0.7 에서 한 장씩)
 */
export function ghostsDue(count: number, k: number, from: number, to: number): number {
  if (count <= 0 || k < from) return 0;
  if (count === 1) return 1;
  return Math.min(count, 1 + Math.floor(((k - from) / (to - from)) * (count - 1) + 1e-9));
}
