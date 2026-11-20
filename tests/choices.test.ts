// 선택지가 뜨는 횟수 (기획서 7.3절): 시즌 하나를 전부 훑으며 끝냈을 때 고르는 선택지는 30~35번쯤이어야 한다.
// 무리를 처치할 때마다 보상 상자가 나오던 것을, 섹터마다 정한 수만큼 몇 무리마다 하나씩 나오게 바꾸었다.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { chestBudget, chestsDue, packsToNextChest } from '../src/game/run/chests';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';
import { averageChoices, rewardsOf, totalOf } from './helpers/choices';

describe('보상 상자의 박자', () => {
  /** 무리 total 개를 차례로 처치할 때 상자가 나오는 번째들 */
  const beats = (total: number, budget: number): number[] => {
    const out: number[] = [];
    for (let k = 1; k <= total; k++) if (chestsDue(k, total, budget) > chestsDue(k - 1, total, budget)) out.push(k);
    return out;
  };

  it('정한 수만큼 고르게 나오고, 마지막 무리에서 마지막 상자가 나온다', () => {
    expect(beats(8, 4)).toEqual([2, 4, 6, 8]);
    expect(beats(9, 4)).toEqual([3, 5, 7, 9]);
    expect(beats(4, 2)).toEqual([2, 4]);
    expect(beats(5, 2)).toEqual([3, 5]);
    expect(beats(3, 1)).toEqual([3]);
    expect(beats(2, 1)).toEqual([2]);
    expect(beats(5, 0)).toEqual([]);
  });

  it('수를 정하지 않았거나 무리보다 많으면 무리마다 하나', () => {
    expect(beats(4, -1)).toEqual([1, 2, 3, 4]);
    expect(beats(3, 9)).toEqual([1, 2, 3]);
    expect(chestBudget(0, 3)).toBe(0);
  });

  it('다음 상자까지 남은 무리 수를 알려 준다', () => {
    expect(packsToNextChest(0, 8, 4)).toBe(2);
    expect(packsToNextChest(1, 8, 4)).toBe(1);
    expect(packsToNextChest(2, 8, 4)).toBe(2);
    expect(packsToNextChest(0, 9, 4)).toBe(3);
    expect(packsToNextChest(3, 9, 4)).toBe(2);
    expect(packsToNextChest(8, 8, 4)).toBe(0);
    expect(packsToNextChest(0, 5, 0)).toBe(0);
  });
});

describe('섹터에서 나오는 보상 상자', () => {
  const chests = (w: World): number => w.things.filter((t) => t.kind === 'chest').length;
  /** 무리 하나를 전멸시킨다 */
  const wipe = (w: World, pack: World['packs'][number]): void => {
    for (const e of [...pack.members]) if (!e.dead) w.kill(e, null, true);
  };

  it.each([1, 2, 3])('시즌 %i: 모든 일반 섹터에서 정한 수만큼만 나오고, 출구 수호 무리는 상자를 남기지 않는다', (season) => {
    const run = RunState.create(['serin', 'mido', 'sia'], 'B', 'form', season);
    for (const def of db.sectors.filter((s) => s.type === 'normal')) {
      const rng = new Rng(100 + def.index);
      const w = new World(run, buildSector(run, def, rng), rng);
      // 돌발 사건이 놓은 상자는 빼고 센다
      const before = chests(w);
      const regular = w.packs.filter((p) => !p.gate);
      const want = chestBudget(regular.length, def.chests);
      expect(w.quest().chests, `섹터 ${def.index}`).toBe(want);
      let given = 0;
      regular.forEach((p, i) => {
        wipe(w, p);
        const now = chests(w) - before;
        // 한 무리에 하나를 넘지 않는다
        expect(now - given, `섹터 ${def.index} 무리 ${i + 1}`).toBeLessThanOrEqual(1);
        given = now;
        expect(w.quest().chestsGiven).toBe(given);
      });
      expect(given, `섹터 ${def.index}`).toBe(want);
      expect(w.quest().chestIn).toBe(0);
      const gate = w.packs.find((p) => p.gate);
      if (gate) {
        wipe(w, gate);
        expect(chests(w) - before, `섹터 ${def.index} 출구 수호 무리`).toBe(want);
        // 출구는 열린다
        expect(w.quest().exitOpen).toBe(true);
      }
    }
  });

  it('상자의 품질은 지난 상자 뒤로 처치한 무리 가운데 가장 높은 것을 따른다', () => {
    const run = RunState.create(['serin', 'mido', 'sia'], 'B', 'form', 2);
    const def = db.sector(1);
    const rng = new Rng(7);
    const w = new World(run, buildSector(run, def, rng), rng);
    const regular = w.packs.filter((p) => !p.gate);
    regular[0].quality = 3;
    regular[1].quality = 1;
    const before = w.things.length;
    wipe(w, regular[0]);
    wipe(w, regular[1]);
    const chest = w.things.slice(before).find((t) => t.kind === 'chest');
    expect(chest?.quality).toBe(3);
    // 다음 상자는 다시 낮은 품질에서 시작한다
    regular[2].quality = 1;
    regular[3].quality = 2;
    wipe(w, regular[2]);
    wipe(w, regular[3]);
    const list = w.things.slice(before).filter((t) => t.kind === 'chest');
    expect(list.map((t) => t.quality)).toEqual([3, 2]);
  });

  it('봉인 상자에서 나온 무리는 섹터의 상자 수와 상관없이 상자를 남긴다', () => {
    const run = RunState.create(['serin', 'mido', 'sia'], 'B', 'form', 1);
    const def = db.sector(4);
    const rng = new Rng(3);
    const w = new World(run, buildSector(run, def, rng), rng);
    const before = chests(w);
    const sealed = w.spawnPack({ x: w.party.x, y: w.party.y, gate: false, quality: 2, sure: true, members: [{ def: db.monster('wisp'), grade: 1 }] });
    wipe(w, sealed);
    expect(chests(w) - before).toBe(1);
    // 섹터의 박자에는 들지 않는다
    expect(w.quest().chestsGiven).toBe(0);
    expect(w.chest.kills).toBe(0);
  });
});

describe('한 시즌에서 고르는 선택지의 수', () => {
  const RUNS = 300;
  it.each(db.seasons.map((s) => [s.id, s.label || `시즌 ${s.id}`] as const))('시즌 %i (%s): 전부 훑으며 끝내면 30~35번쯤 뜬다', (season) => {
    const rows: Record<string, unknown>[] = [];
    const totals: number[] = [];
    for (const routeId of ['normal', 'special']) {
      const c = averageChoices(season, RUNS, routeId);
      const r1 = (n: number): number => Math.round(n * 10) / 10;
      rows.push({
        경로: routeId,
        '무리 상자': r1(c.packChest),
        '클리어 보상': r1(c.clear),
        '봉인·돌발 상자': r1(c.extraChest),
        제단: r1(c.altar),
        '3택1 합계': r1(rewardsOf(c)),
        '경로 선택': r1(c.route),
        'NPC 이벤트': r1(c.npc),
        보따리: r1(c.stash),
        합계: r1(totalOf(c)),
      });
      totals.push(totalOf(c));
    }
    console.table(rows);
    for (const t of totals) {
      expect(t, `시즌 ${season}`).toBeGreaterThanOrEqual(30);
      expect(t, `시즌 ${season}`).toBeLessThanOrEqual(36);
    }
  });
});
