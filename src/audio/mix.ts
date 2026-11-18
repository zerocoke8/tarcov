// 소리 섞기에 쓰는 계산. 브라우저 기능을 쓰지 않는 순수 함수만 둔다 (tests/sound.test.ts에서 검사).

/** 거리에 따른 크기: near 안에서는 1, far 에서 0, 그 사이는 고르게 줄어든다 */
export function falloff(dist: number, near: number, far: number): number {
  if (dist <= near) return 1;
  if (dist >= far) return 0;
  return 1 - (dist - near) / (far - near);
}

/** 좌우 위치 (-1 왼쪽 ~ 1 오른쪽). 화면 가운데에서 width 만큼 떨어지면 limit 까지 치우친다 */
export function panOf(dx: number, width: number, limit: number): number {
  if (width <= 0) return 0;
  return Math.max(-limit, Math.min(limit, (dx / width) * limit));
}

/** n 개 가운데 하나를 고르되, 방금 고른 것(last)은 피한다. rnd 는 0 이상 1 미만의 난수 */
export function pickOther(n: number, last: number, rnd: number): number {
  if (n <= 1) return 0;
  if (last < 0 || last >= n) return Math.min(n - 1, Math.floor(rnd * n));
  const k = Math.min(n - 2, Math.floor(rnd * (n - 1)));
  return k >= last ? k + 1 : k;
}

/** 0~1 로 자른다. 숫자가 아니면 fallback */
export function unit(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}

/**
 * 음량 슬라이더 값(0~1)을 실제 배율로 바꾼다. 귀는 크기를 곱으로 느끼므로 제곱으로 휘어,
 * 슬라이더의 가운데가 "절반쯤의 크기"로 들리게 한다.
 */
export function volumeCurve(v: number): number {
  return v * v;
}

/**
 * 끊김 없는 반복의 재생 시각표. 소리 파일은 "반복 주기(period) + 겹침(cross)" 길이로 만들어져 있고,
 * 끝의 겹침 구간은 맨 앞부분과 같은 소리다. k 번째 재생은 startAt + k * period 에 시작해
 * 겹침 동안 커지고(첫 재생은 처음부터 다 켜져 있다), 다음 재생이 시작될 때부터 겹침 동안 작아진다.
 * 겹치는 두 재생은 같은 소리를 같은 박자로 내므로 합친 크기는 변하지 않는다.
 */
export function loopSlot(startAt: number, period: number, cross: number, k: number): { at: number; fadeInEnd: number; fadeOutAt: number; end: number } {
  const at = startAt + k * period;
  return { at, fadeInEnd: k === 0 ? at : at + cross, fadeOutAt: at + period, end: at + period + cross };
}
