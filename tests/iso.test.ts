// 마름모(아이소메트릭) 화면 검사: 좌표 변환, 벽 높이 규칙(높은 벽이 바닥을 가리지 않는지),
// 마름모 시즌의 표와 맵, 마름모 맵 그림, 런 자동 플레이.
import { afterEach, describe, expect, it } from 'vitest';
import { csvRecords } from '../src/core/csv';
import { db } from '../src/data/tables';
import { RunState } from '../src/game/run/RunState';
import { getLayout } from '../src/game/run/sector';
import { TILE } from '../src/game/world/layout';
import { buildIsoWalls, ISO_LIFT, ISO_SX, ISO_SY } from '../src/render/isoWalls';
import { ISO_A, ISO_B, proj } from '../src/render/proj';
import { playRun } from './helpers/play';

const isoSeasons = db.seasons.filter((s) => db.sectorsOf(s.id).some((x) => x.view === 'iso'));
const isoSectors = db.allSectors.filter((s) => s.view === 'iso');

afterEach(() => proj.use('flat'));

describe('좌표 변환', () => {
  it('기존 화면에서는 아무것도 바꾸지 않는다', () => {
    proj.use('flat');
    expect([proj.x(130, 70), proj.y(130, 70), proj.depth(130, 70)]).toEqual([130, 70, 70]);
    expect(proj.angle(1.2)).toBe(1.2);
    expect([proj.vx(3, 4), proj.vy(3, 4)]).toEqual([3, 4]);
    expect([proj.inputX(0.6, -0.8), proj.inputY(0.6, -0.8)]).toEqual([0.6, -0.8]);
    // 높이는 그대로 위로, 옆으로는 그대로 옆으로
    expect([proj.liftX(24), proj.liftY(24)]).toEqual([0, -24]);
    expect([proj.sideX(10), proj.sideY(10)]).toEqual([10, 0]);
    expect(proj.ground).toEqual([1, 0, 0, 1]);
  });

  it('마름모 화면: +x 는 화면 오른쪽 아래로, +y 는 왼쪽 아래로 가고, 한 칸이 가로 2 : 세로 1 의 마름모가 된다', () => {
    proj.use('iso');
    expect(proj.x(TILE, 0)).toBeCloseTo(ISO_SX);
    expect(proj.y(TILE, 0)).toBeCloseTo(ISO_SY);
    expect(proj.x(0, TILE)).toBeCloseTo(-ISO_SX);
    expect(proj.y(0, TILE)).toBeCloseTo(ISO_SY);
    // 칸의 가로 폭(왼쪽 끝 ~ 오른쪽 끝)은 세로 폭(위 끝 ~ 아래 끝)의 두 배
    const wide = proj.x(TILE, 0) - proj.x(0, TILE);
    const tall = proj.y(TILE, TILE) - proj.y(0, 0);
    expect(wide / tall).toBeCloseTo(2);
    // 화면에서 아래에 있을수록 앞
    expect(proj.depth(200, 200)).toBeGreaterThan(proj.depth(100, 250));
  });

  it('마름모 화면: 화면에서 옆으로 걷는 빠르기는 기존 화면과 같고, 위아래로는 절반이다', () => {
    proj.use('iso');
    // 화면 오른쪽 = 월드 (+x, -y)
    const d = 100 * Math.SQRT1_2;
    expect(proj.vx(d, -d)).toBeCloseTo(100);
    expect(proj.vy(d, -d)).toBeCloseTo(0);
    // 화면 아래 = 월드 (+x, +y)
    expect(proj.vx(d, d)).toBeCloseTo(0);
    expect(proj.vy(d, d)).toBeCloseTo(50);
  });

  it('조작: D패드의 방향대로 화면에서 움직이고, 대각선은 바닥 격자의 줄과 나란하다', () => {
    proj.use('iso');
    const go = (dx: number, dy: number): [number, number] => {
      const wx = proj.inputX(dx, dy);
      const wy = proj.inputY(dx, dy);
      // 월드에서의 빠르기는 방향과 상관없이 같아야 한다
      expect(Math.hypot(wx, wy)).toBeCloseTo(Math.hypot(dx, dy));
      return [proj.vx(wx, wy), proj.vy(wx, wy)];
    };
    const right = go(1, 0);
    expect(right[0]).toBeGreaterThan(0.99);
    expect(right[1]).toBeCloseTo(0);
    const up = go(0, -1);
    expect(up[0]).toBeCloseTo(0);
    expect(up[1]).toBeLessThan(-0.49);
    // 오른쪽 아래 대각선 = 월드의 +x 방향 (길이 나 있는 방향)
    const s = Math.SQRT1_2;
    expect(proj.inputX(s, s)).toBeCloseTo(1);
    expect(proj.inputY(s, s)).toBeCloseTo(0);
    // 오른쪽 위 대각선 = 월드의 -y 방향
    expect(proj.inputX(s, -s)).toBeCloseTo(0);
    expect(proj.inputY(s, -s)).toBeCloseTo(-1);
  });

  it('방향: 바닥 위의 방향이 화면에서 어느 쪽으로 보이는지', () => {
    proj.use('iso');
    // 월드 +x 는 화면에서 오른쪽 아래로 26.57도 (기울기 1/2)
    expect(Math.tan(proj.angle(0))).toBeCloseTo(0.5);
    // 월드 (+x, -y) 대각선은 화면에서 정확히 오른쪽
    expect(proj.angle(-Math.PI / 4)).toBeCloseTo(0);
    // 월드 (+x, +y) 대각선은 화면에서 정확히 아래
    expect(proj.angle(Math.PI / 4)).toBeCloseTo(Math.PI / 2);
  });

  it('눕혀 그리는 층: 그 층의 변환이 바닥의 점을 같은 화면 자리에 놓고, 높이만큼 올리는 이동량이 화면에서 곧게 위를 향한다', () => {
    proj.use('iso');
    const [a, b, c, d] = proj.ground;
    const sx = (x: number, y: number): number => a * x + c * y;
    const sy = (x: number, y: number): number => b * x + d * y;
    expect(sx(321, 123)).toBeCloseTo(proj.x(321, 123));
    expect(sy(321, 123)).toBeCloseTo(proj.y(321, 123));
    const h = 24;
    expect(sx(proj.liftX(h), proj.liftY(h))).toBeCloseTo(0);
    expect(sy(proj.liftX(h), proj.liftY(h))).toBeCloseTo(-h);
    // 화면에서 옆으로 10px 떨어진 바닥의 점
    expect(sx(proj.sideX(10), proj.sideY(10))).toBeCloseTo(10);
    expect(sy(proj.sideX(10), proj.sideY(10))).toBeCloseTo(0);
    expect([ISO_A, ISO_B]).toEqual([Math.SQRT1_2, Math.SQRT1_2 / 2]);
  });
});

describe('마름모 시즌의 표', () => {
  it('마름모로 그리는 시즌이 있고, 내용(무리·시즌 스킬·장비·귀중품)은 기준 시즌의 것을 쓴다', () => {
    expect(isoSeasons.length).toBeGreaterThan(0);
    for (const s of isoSeasons) {
      expect(s.base, `시즌 ${s.id}의 base`).not.toBe(s.id);
      const run = RunState.create(['serin', 'mido', 'sia'], 'B', 'form', s.id);
      expect(run.season).toBe(s.id);
      expect(db.sectors.every((x) => x.season === s.id && x.view === 'iso')).toBe(true);
      expect(db.packs.length).toBeGreaterThan(0);
      expect(db.packs.every((p) => p.season === s.base)).toBe(true);
      expect(db.equipPool).toHaveLength(21);
      expect(db.equipPool.every((k) => k.season === s.base)).toBe(true);
      expect(db.valuablePool.every((v) => v.season === s.base)).toBe(true);
      expect(db.baseOf(s.id)).toBe(s.base);
    }
  });

  it('기준 시즌과 섹터 구성이 같다: 같은 순서, 같은 종류, 같은 몬스터와 보상 수', () => {
    for (const s of isoSeasons) {
      const mine = db.sectorsOf(s.id).sort((a, b) => a.index - b.index);
      const base = db.sectorsOf(s.base).sort((a, b) => a.index - b.index);
      expect(mine.map((x) => x.index)).toEqual(base.map((x) => x.index));
      for (const [i, m] of mine.entries()) {
        const b = base[i];
        expect([m.name, m.type, m.scene, m.packs, m.chests, m.loot, m.depth, m.fog, m.camp, JSON.stringify(m.gate)], `섹터 ${m.index}`).toEqual([b.name, b.type, b.scene, b.packs, b.chests, b.loot, b.depth, b.fog, b.camp, JSON.stringify(b.gate)]);
        // 맵은 따로 만든 것이다 (기존 맵은 그대로 둔다)
        expect(m.map).not.toBe(b.map);
      }
    }
  });

  it('기존 시즌은 모두 기존 화면으로 그린다', () => {
    for (const s of db.seasons.filter((x) => x.base === x.id)) {
      expect(db.sectorsOf(s.id).every((x) => x.view === 'flat'), `시즌 ${s.id}`).toBe(true);
    }
  });
});

describe('마름모 맵', () => {
  it.each(isoSectors.filter((s) => s.type !== 'boss').map((s) => [s.map] as const))('%s: 화면 왼쪽에서 시작해 오른쪽으로 나아간다', (name) => {
    const l = getLayout(name);
    expect(l.exit).not.toBeNull();
    // 화면에서의 가로 위치는 x - y
    const at = (p: { x: number; y: number }): number => p.x - p.y;
    expect(at(l.exit!) - at(l.start)).toBeGreaterThan(12);
    if (l.gate) expect(at(l.gate)).toBeGreaterThan(at(l.start));
  });

  it.each(isoSectors.map((s) => [s.map, s.packs, s.loot] as const))('%s: 무리·수색 후보 자리가 넉넉하다', (name, packs, loot) => {
    const l = getLayout(name);
    expect(l.packSlots.length).toBeGreaterThanOrEqual(packs);
    // 돌발 사건이 쓸 빈자리가 하나는 남아야 한다
    if (loot > 0) expect(l.lootSlots.length).toBeGreaterThan(loot);
  });

  it.each(isoSectors.map((s) => [s.map] as const))('%s: 높은 벽이 걸어 다니는 바닥을 가리지 않는다', (name) => {
    const l = getLayout(name);
    const walls = buildIsoWalls(l.w, l.h, l.base);
    const floors: [number, number][] = [];
    const tall: [number, number][] = [];
    let low = 0;
    for (let y = -8; y < l.h + 8; y++) {
      for (let x = -8; x < l.w + 8; x++) {
        const lv = walls.at(x, y);
        if (walls.floorAt(x, y)) {
          floors.push([x, y]);
          expect(lv, `바닥 (${x}, ${y})`).toBe(0);
        } else if (lv === 2) tall.push([x, y]);
        else if (lv === 1) low++;
      }
    }
    // 방의 뒷벽은 높게 서고, 앞쪽 벽은 낮게 잘린다: 둘 다 있어야 한다
    expect(tall.length).toBeGreaterThan(20);
    expect(low).toBeGreaterThan(20);
    // 벽 하나가 화면에서 차지하는 모양: 밑면 마름모에서 벽 높이만큼 위로 올린 기둥.
    // 어떤 바닥 칸의 가운데도 높은 벽의 기둥 안에 들어가면 안 된다 (그 벽보다 뒤에 있는 바닥일 때)
    const L = ISO_LIFT[2];
    for (const [wx, wy] of tall) {
      const cx = (wx - wy) * ISO_SX;
      const cy = (wx + wy + 1) * ISO_SY;
      for (const [fx, fy] of floors) {
        const dx = Math.abs((fx - fy) * ISO_SX - cx);
        if (dx >= ISO_SX) continue;
        // 바닥이 벽보다 화면에서 얼마나 위에 있는지
        const up = cy - (fx + fy + 1) * ISO_SY;
        if (up <= 0) continue;
        expect(up, `높은 벽 (${wx}, ${wy}) 이 바닥 (${fx}, ${fy}) 을 가립니다`).toBeGreaterThanOrEqual(L + ISO_SY * (1 - dx / ISO_SX));
      }
    }
  });

  it('바닥 바로 앞의 벽은 낮게 잘리고, 뒤에 아무것도 없는 벽은 높이 선다', () => {
    // 가운데에 3x3 방이 하나 있는 맵
    const w = 9;
    const h = 9;
    const base = new Uint8Array(w * h).fill(1);
    for (let y = 3; y <= 5; y++) for (let x = 3; x <= 5; x++) base[y * w + x] = 0;
    const walls = buildIsoWalls(w, h, base);
    // 방의 뒤쪽(화면 위쪽 = x, y 가 작은 쪽) 벽은 높다
    expect(walls.at(3, 2)).toBe(2);
    expect(walls.at(2, 3)).toBe(2);
    expect(walls.at(2, 2)).toBe(2);
    // 방의 앞쪽 벽은 낮다
    expect(walls.at(6, 5)).toBe(1);
    expect(walls.at(5, 6)).toBe(1);
    expect(walls.at(6, 6)).toBe(1);
    // 방에서 멀리 떨어진 앞쪽은 세우지 않는다 (테두리만 남긴다)
    expect(walls.at(9, 9)).toBe(0);
    // 맵 바깥도 벽으로 본다: 방 뒤쪽의 바깥은 높은 벽
    expect(walls.at(-1, -1)).toBe(2);
    expect(walls.far(3, 2)).toBe(1);
    expect(walls.far(4, 4)).toBe(0);
  });
});

describe('마름모 맵 그림', () => {
  const tables = import.meta.glob<string>('/data/art/iso*.csv', { eager: true, query: '?raw', import: 'default' });
  const read = (name: string): Record<string, string>[] => csvRecords(tables[`/data/art/${name}`]).rows.map((r) => r.cells);
  interface IsoFile {
    pages: string[];
    face: number[] | null;
    structs: { id: string; tw: number; th: number; rate: number }[];
  }
  const files = import.meta.glob<IsoFile>('/public/iso/*/iso.json', { eager: true, import: 'default' });
  const pages = Object.keys(import.meta.glob('/public/iso/*/*.webp'));

  it('마름모로 그리는 섹터의 맵 그림 세트마다 벽 앞면과 구조물이 게임 폴더에 들어 있다', () => {
    const table = read('iso.csv');
    for (const set of new Set(isoSectors.map((s) => s.scene))) {
      const file = files[`/public/iso/${set}/iso.json`];
      expect(file, `public/iso/${set}/iso.json 이 없습니다 (npm run art -- iso)`).toBeTruthy();
      expect(file.face, `${set}: 벽 앞면`).toBeTruthy();
      for (const p of file.pages) expect(pages).toContain(`/public/iso/${set}/${p}`);
      const want = table.filter((r) => r.set === set).map((r) => r.id);
      expect(want.length).toBeGreaterThan(0);
      for (const id of want) expect(file.structs.some((s) => s.id === id), `${set}: 구조물 ${id} 의 그림이 없습니다 (npm run art -- iso)`).toBe(true);
      for (const s of file.structs) {
        expect(s.rate, s.id).toBeGreaterThan(0);
        expect(s.tw * s.th, s.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('마름모 시즌 런 자동 플레이', () => {
  it.each(isoSeasons.map((s) => [s.id] as const))('시즌 %i: 새 맵에서 끝까지 진행한다', (season) => {
    for (const [seed, routeId, team, petId] of [
      [41, 'normal', ['serin', 'mido', 'sia'], 'B'],
      [42, 'elite', ['karen', 'raon', 'yuna'], 'A'],
      [43, 'hidden', ['haru', 'roa', 'eve'], 'C'],
    ] as const) {
      const { run, outcome, stuck } = playRun(seed, routeId, [...team], petId, season, 900);
      console.log(`시즌 ${season} 시드 ${seed} ${routeId}: ${outcome} · 클리어 섹터 ${run.cleared} · ${Math.round(run.time / 60)}분`);
      expect(outcome, stuck).not.toBe('stuck');
      expect(run.season).toBe(season);
      // 시즌 스킬과 장비는 기준 시즌의 것만 나온다
      const base = db.baseOf(season);
      for (const id of Object.keys(run.upgrades)) {
        const u = db.upgrade(id);
        if (u.category === 'season') expect(u.season, id).toBe(base);
      }
      for (const { item } of run.allItems()) expect(db.equipSkill(item.skill).season, item.skill).toBe(base);
    }
  }, 600000);
});
