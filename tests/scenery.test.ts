// 맵 그림 검사: 시트를 칸별로 자르는 계산, 이어 붙는 질감 만들기,
// 그리고 public/scenery/ 의 그림이 실제 맵에 쓰이는 모든 오브젝트를 빠짐없이 갖췄는지.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { getLayout } from '../src/game/run/sector';
import { buildPlan } from '../src/game/world/placement';
import { cutGrid, makeSeamless, type Img } from '../tools/art/lib/pixels';

function blank(w: number, h: number): Img {
  return { w, h, data: new Uint8Array(w * h * 4) };
}

function fill(img: Img, x: number, y: number, w: number, h: number): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) img.data.set([200, 120, 60, 255], (yy * img.w + xx) * 4);
}

describe('시트를 칸별로 자르기', () => {
  it('칸마다 물체의 상자를 읽는 순서대로 찾는다', () => {
    const img = blank(300, 200);
    fill(img, 20, 20, 60, 50); // 1번 칸
    fill(img, 130, 30, 40, 40); // 2번 칸
    fill(img, 210, 10, 70, 80); // 3번 칸
    fill(img, 30, 120, 50, 60); // 4번 칸
    fill(img, 230, 130, 30, 30); // 6번 칸 (5번 칸은 비어 있음)
    const boxes = cutGrid(img, 2, 3);
    expect(boxes).toEqual([
      { x: 20, y: 20, w: 60, h: 50 },
      { x: 130, y: 30, w: 40, h: 40 },
      { x: 210, y: 10, w: 70, h: 80 },
      { x: 30, y: 120, w: 50, h: 60 },
      null,
      { x: 230, y: 130, w: 30, h: 30 },
    ]);
  });

  it('한 물체가 떨어진 조각으로 이뤄져 있으면 같은 칸의 조각을 합친다', () => {
    const img = blank(200, 100);
    fill(img, 20, 20, 30, 30);
    fill(img, 60, 60, 20, 20); // 같은 칸의 떨어진 조각 (예: 떠 있는 수정과 그 아래 조각)
    expect(cutGrid(img, 1, 2)[0]).toEqual({ x: 20, y: 20, w: 60, h: 60 });
  });

  it('칸 경계를 조금 넘는 물체도 잘리지 않는다', () => {
    const img = blank(200, 100);
    fill(img, 30, 20, 80, 60); // 가운데가 1번 칸인 물체가 2번 칸으로 10px 넘어감
    expect(cutGrid(img, 1, 2)).toEqual([{ x: 30, y: 20, w: 80, h: 60 }, null]);
  });

  it('작은 잡티는 물체로 보지 않는다', () => {
    const img = blank(100, 100);
    fill(img, 10, 10, 3, 3);
    expect(cutGrid(img, 1, 1)).toEqual([null]);
  });
});

describe('이어 붙는 질감', () => {
  /** 가로·세로로 서서히 변하는 무늬 (그대로 이어 붙이면 경계가 뚜렷하게 보인다) */
  function gradient(size: number): Img {
    const img = blank(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) img.data.set([Math.round((x / size) * 255), Math.round((y / size) * 255), 128, 255], (y * size + x) * 4);
    }
    return img;
  }
  const px = (img: Img, x: number, y: number): number[] => [...img.data.slice((y * img.w + x) * 4, (y * img.w + x) * 4 + 3)];
  const diff = (a: number[], b: number[]): number => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

  it('오른쪽 끝과 왼쪽 끝, 아래쪽 끝과 위쪽 끝이 이어진다', () => {
    const src = gradient(100);
    // 원본은 양 끝이 크게 다르다
    expect(diff(px(src, 0, 50), px(src, 99, 50))).toBeGreaterThan(200);
    const out = makeSeamless(src, 0.2);
    expect(out.w).toBe(80);
    expect(out.h).toBe(80);
    for (const k of [5, 40, 75]) {
      expect(diff(px(out, 0, k), px(out, out.w - 1, k)), `가로 ${k}`).toBeLessThanOrEqual(6);
      expect(diff(px(out, k, 0), px(out, k, out.h - 1)), `세로 ${k}`).toBeLessThanOrEqual(6);
    }
  });

  it('가로로만 이어 붙이면 세로 크기는 그대로다', () => {
    const out = makeSeamless(gradient(100), 0.2, 'x');
    expect(out.w).toBe(80);
    expect(out.h).toBe(100);
    expect(diff(px(out, 0, 50), px(out, 79, 50))).toBeLessThanOrEqual(6);
  });
});

describe('등록된 맵 그림', () => {
  interface SceneryFile {
    version: number;
    roof: number[] | null;
    wall: number[] | null;
    pages: string[];
    props: Record<string, unknown[]>;
    things: Record<string, unknown>;
    wallDecals: unknown[];
    floorDecals: unknown[];
  }
  const file = Object.values(import.meta.glob<SceneryFile>('/public/scenery/scenery.json', { eager: true, import: 'default' }))[0];

  // 맵 그림이 아직 없으면 게임은 도형으로 그리므로 검사할 것이 없다
  it.skipIf(!file)('모든 맵의 엄폐 오브젝트와 상호작용 오브젝트에 그림이 있다 (도형으로 남는 것이 없다)', () => {
    expect(file.version).toBe(1);
    expect(file.roof).toBeTruthy();
    expect(file.wall).toBeTruthy();
    const need = new Set<string>();
    for (const name of db.mapNames) {
      for (let seed = 1; seed <= 12; seed++) {
        const plan = buildPlan(getLayout(name), { density: 0.16, packs: 4, loot: 5, npcChance: 1, packMinFromStart: 8, packMinApart: 6 }, new Rng(seed));
        for (const p of plan.props) need.add(`${p.kind}:${p.tw}x${p.th}`);
      }
    }
    for (const key of need) expect(file.props[key]?.length ?? 0, `엄폐 오브젝트 ${key}`).toBeGreaterThan(0);
    for (const kind of ['exit', 'chest', 'crate', 'medkit', 'relic', 'sealed', 'npc']) expect(file.things[kind], `상호작용 오브젝트 ${kind}`).toBeTruthy();
    expect(file.wallDecals.length).toBeGreaterThan(0);
    expect(file.floorDecals.length).toBeGreaterThan(0);
  });
});
