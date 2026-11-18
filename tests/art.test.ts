// 스프라이트 제작 도구의 픽셀 계산 검사: 배경 제거, 발 위치, 반복 주기·동작 구간 찾기, 프레임 고르기, 시트 배치.
import { describe, expect, it } from 'vitest';
import {
  alphaBox,
  bodyMetrics,
  borderKey,
  chromaKey,
  findAction,
  findCycle,
  packShelves,
  pickFrames,
  removeSpecks,
  shrinkAlpha,
  thumb,
  type Img,
  type Rgb,
} from '../tools/art/lib/pixels';

const GREEN: Rgb = [0, 255, 0];

function canvas(w: number, h: number, bg: Rgb): Img {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([bg[0], bg[1], bg[2], 255], i * 4);
  return { w, h, data };
}

function rect(img: Img, x: number, y: number, w: number, h: number, c: Rgb): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) img.data.set([c[0], c[1], c[2], 255], (yy * img.w + xx) * 4);
}

const px = (img: Img, x: number, y: number): number[] => [...img.data.slice((y * img.w + x) * 4, (y * img.w + x) * 4 + 4)];

describe('배경 제거', () => {
  it('가장자리에서 배경색을 찾고, 배경만 투명해진다', () => {
    const img = canvas(40, 40, [6, 243, 9]);
    rect(img, 10, 10, 20, 20, [200, 40, 50]);
    const key = borderKey(img);
    expect(key).toEqual([6, 243, 9]);
    chromaKey(img, key);
    expect(px(img, 2, 2)[3]).toBe(0);
    expect(px(img, 20, 20)).toEqual([200, 40, 50, 255]);
    expect(alphaBox(img)).toEqual({ x: 10, y: 10, w: 20, h: 20 });
  });

  it('배경의 명암 얼룩과 옅은 그림자도 함께 빠진다', () => {
    const img = canvas(20, 20, GREEN);
    rect(img, 4, 4, 4, 4, [0, 200, 0]);
    rect(img, 10, 10, 4, 4, [20, 230, 30]);
    chromaKey(img, GREEN);
    expect(alphaBox(img)).toBeNull();
  });

  it('배경과 색조가 다른 색(노랑·청록·흰색·검정)은 남는다', () => {
    const colors: Rgb[] = [
      [255, 220, 40],
      [40, 200, 220],
      [255, 255, 255],
      [20, 20, 24],
      [240, 170, 180],
    ];
    const img = canvas(60, 20, GREEN);
    colors.forEach((c, i) => rect(img, 5 + i * 10, 5, 8, 8, c));
    chromaKey(img, GREEN);
    colors.forEach((c, i) => {
      const p = px(img, 9 + i * 10, 9);
      expect(p[3], `색 ${c.join(',')}`).toBeGreaterThan(230);
    });
  });

  it('배경색과 섞인 경계 픽셀은 반투명해지고 초록 번짐이 걷힌다', () => {
    const img = canvas(10, 10, GREEN);
    // 검은 외곽선과 배경이 반반 섞인 픽셀
    rect(img, 5, 5, 1, 1, [0, 128, 0]);
    chromaKey(img, GREEN);
    const [r, g, b, a] = px(img, 5, 5);
    expect(a).toBeGreaterThan(40);
    expect(a).toBeLessThan(200);
    expect(g).toBeLessThan(40);
    expect(r + b).toBeLessThan(40);
  });

  it('채도가 없는 배경은 거부한다', () => {
    expect(() => chromaKey(canvas(4, 4, [128, 128, 128]), [128, 128, 128])).toThrow(/채도/);
  });

  it('가장자리 깎기와 잡티 제거', () => {
    const img = canvas(30, 30, GREEN);
    rect(img, 5, 5, 12, 12, [200, 40, 50]);
    rect(img, 24, 24, 2, 2, [200, 40, 50]);
    chromaKey(img, GREEN);
    expect(removeSpecks(img, 10)).toBe(1);
    expect(alphaBox(img)).toEqual({ x: 5, y: 5, w: 12, h: 12 });
    shrinkAlpha(img, 1);
    expect(alphaBox(img)).toEqual({ x: 6, y: 6, w: 10, h: 10 });
  });
});

describe('기본 자세 측정', () => {
  it('무기 끝이 발보다 아래로 내려가도 발 위치를 몸통 아래에서 찾는다', () => {
    const img = canvas(200, 200, GREEN);
    rect(img, 80, 40, 40, 40, [240, 170, 180]); // 머리
    rect(img, 88, 80, 24, 40, [200, 40, 50]); // 몸
    rect(img, 88, 120, 8, 20, [250, 250, 250]); // 다리
    rect(img, 104, 120, 8, 20, [250, 250, 250]);
    rect(img, 30, 100, 6, 60, [180, 180, 190]); // 발보다 아래로 내려간 검
    chromaKey(img, GREEN);
    const box = alphaBox(img)!;
    expect(box.y + box.h).toBe(160);
    const m = bodyMetrics(img, box);
    expect(m.footY).toBe(140);
    expect(m.height).toBe(100);
    expect(Math.abs(m.footX - 100)).toBeLessThan(2);
  });
});

/** 원이 좌우로 흔들리는 가짜 영상. phase가 2PI면 한 주기 */
function wobble(phase: number): Float32Array {
  const img = canvas(64, 64, GREEN);
  rect(img, Math.round(26 + 12 * Math.sin(phase)), Math.round(26 + 6 * Math.cos(phase)), 12, 12, [200, 40, 50]);
  chromaKey(img, GREEN);
  return thumb(img, 16);
}

describe('구간 찾기', () => {
  it('반복 동작에서 한 주기를 찾는다 (두 주기를 고르지 않는다)', () => {
    const period = 12;
    const thumbs = Array.from({ length: 60 }, (_, i) => wobble((i / period) * Math.PI * 2));
    const c = findCycle(thumbs, 5, 40);
    expect(c.end - c.start).toBe(period);
    expect(c.score).toBeLessThan(1e-6);
  });

  it('단발 동작에서 움직이는 구간만 잘라낸다', () => {
    // 0~19 대기, 20~39 동작, 40~59 대기
    const thumbs = Array.from({ length: 60 }, (_, i) => wobble(i >= 20 && i < 40 ? ((i - 19) / 21) * Math.PI : 0));
    const r = findAction(thumbs, 1);
    expect(r.start).toBeGreaterThanOrEqual(18);
    expect(r.start).toBeLessThanOrEqual(21);
    expect(r.end).toBeGreaterThanOrEqual(38);
    expect(r.end).toBeLessThanOrEqual(41);
  });

  it('움직임이 없으면 전체를 돌려준다', () => {
    const thumbs = Array.from({ length: 10 }, () => wobble(0));
    expect(findAction(thumbs)).toEqual({ start: 0, end: 9 });
  });

  it('프레임 고르기: 반복은 끝 프레임을 빼고, 단발은 처음과 끝을 포함한다', () => {
    expect(pickFrames({ start: 0, end: 96 }, 8, true)).toEqual([0, 12, 24, 36, 48, 60, 72, 84]);
    expect(pickFrames({ start: 10, end: 40 }, 4, false)).toEqual([10, 20, 30, 40]);
    // 구간이 짧으면 있는 만큼만
    expect(pickFrames({ start: 3, end: 6 }, 8, true)).toEqual([3, 4, 5]);
    expect(pickFrames({ start: 3, end: 5 }, 8, false)).toEqual([3, 4, 5]);
  });
});

describe('시트 배치', () => {
  it('겹치지 않고, 시트 크기를 넘지 않으며, 넘치면 다음 장으로 간다', () => {
    const sizes = Array.from({ length: 40 }, (_, i) => ({ w: 60 + (i % 7) * 10, h: 90 + (i % 5) * 14 }));
    const { placed, pages } = packShelves(sizes, 512, 2);
    expect(pages.length).toBeGreaterThan(1);
    for (const pg of pages) {
      expect(pg.w).toBeLessThanOrEqual(512);
      expect(pg.h).toBeLessThanOrEqual(512);
    }
    for (let i = 0; i < sizes.length; i++) {
      const a = { ...placed[i], ...sizes[i] };
      expect(a.x + a.w).toBeLessThanOrEqual(pages[a.page].w);
      expect(a.y + a.h).toBeLessThanOrEqual(pages[a.page].h);
      for (let j = i + 1; j < sizes.length; j++) {
        const b = { ...placed[j], ...sizes[j] };
        if (a.page !== b.page) continue;
        const apart = a.x + a.w + 2 <= b.x || b.x + b.w + 2 <= a.x || a.y + a.h + 2 <= b.y || b.y + b.h + 2 <= a.y;
        expect(apart, `${i}번과 ${j}번이 겹침`).toBe(true);
      }
    }
  });

  it('시트 한 장보다 큰 프레임은 오류로 알린다', () => {
    expect(() => packShelves([{ w: 600, h: 100 }], 512)).toThrow(/보다 큽니다/);
  });
});
