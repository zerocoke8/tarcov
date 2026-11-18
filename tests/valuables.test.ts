// 귀중품과 가방 규칙 검사 (기획서 7.12절).
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { computeStats } from '../src/game/run/stats';
import {
  activeCurses,
  addCurse,
  bagAdd,
  bagDiscard,
  bagFull,
  bagValue,
  exchange,
  resolveFind,
  rollFind,
  rollTier,
  rollValuable,
  valueOf,
  type Find,
} from '../src/game/run/valuables';
import { emptyInput } from '../src/game/input';
import { World } from '../src/game/world/World';

const newRun = (): RunState => RunState.create(['serin', 'mido', 'sia'], 'B', 'form');
const SLOTS = db.P('bag.slots');

/** 원하는 종류의 보따리가 나올 때까지 굴린다 */
function findOf(kind: Find['kind'], sector = 2): Find {
  for (let seed = 1; seed < 500; seed++) {
    const f = rollFind(new Rng(seed), sector);
    if (f.kind === kind) return f;
  }
  throw new Error(`${kind} 보따리가 나오지 않았습니다`);
}

describe('가방', () => {
  it('칸 수만큼만 담기고, 가득 차면 버려야 새것을 넣을 수 있다', () => {
    const run = newRun();
    for (let i = 0; i < SLOTS; i++) expect(bagAdd(run, { id: 'key_ring', taint: null })).toBe(true);
    expect(bagFull(run)).toBe(true);
    expect(bagAdd(run, { id: 'moon_bead', taint: null })).toBe(false);
    expect(run.bag).toHaveLength(SLOTS);
    bagDiscard(run, 0);
    expect(bagAdd(run, { id: 'moon_bead', taint: null })).toBe(true);
    expect(run.bag.map((it) => it.id)).toContain('moon_bead');
  });

  it('나가는 순간 은화로 바뀌고 가방이 비워진다. 오염된 물건은 더 비싸다', () => {
    const run = newRun();
    bagAdd(run, { id: 'jade_charm', taint: null });
    bagAdd(run, { id: 'jade_charm', taint: 'frail' });
    const clean = db.valuable('jade_charm').value;
    const dirty = Math.round(clean * db.pct('bag.taintMult'));
    expect(valueOf(run.bag[1])).toBe(dirty);
    expect(dirty).toBeGreaterThan(clean);
    expect(bagValue(run)).toBe(clean + dirty);
    const res = exchange(run);
    expect(res.total).toBe(clean + dirty);
    expect(res.items).toHaveLength(2);
    expect(run.bag).toHaveLength(0);
  });

  it('섹터 사이 저장에 가방과 저주가 들어가고, 불러오면 그대로다', () => {
    const run = newRun();
    bagAdd(run, { id: 'bronze_bell', taint: 'slow' });
    addCurse(run, 'weak');
    const back = RunState.fromJSON(run.toJSON())!;
    expect(back.bag).toEqual([{ id: 'bronze_bell', taint: 'slow' }]);
    expect(back.curses).toEqual(['weak']);
    // 가방이 없던 예전 저장도 불러올 수 있다
    const old = run.toJSON() as unknown as Record<string, unknown>;
    delete old.bag;
    delete old.curses;
    const legacy = RunState.fromJSON(old as never)!;
    expect(legacy.bag).toEqual([]);
    expect(legacy.curses).toEqual([]);
  });
});

describe('저주', () => {
  it('런에 남은 저주와 오염된 물건의 저주가 능력치에 반영된다', () => {
    const run = newRun();
    const def = db.char('serin');
    const base = computeStats(run, def);
    addCurse(run, 'weak');
    bagAdd(run, { id: 'old_photo', taint: 'frail' });
    const cursed = computeStats(run, def);
    expect(activeCurses(run).sort()).toEqual(['frail', 'weak']);
    expect(cursed.atk).toBeCloseTo(base.atk * (1 + db.curse('weak').value / 100));
    expect(cursed.dmgTaken).toBeCloseTo(base.dmgTaken * (1 + db.curse('frail').value / 100));
  });

  it('오염된 물건을 버리면 그 저주가 풀린다. 런에 남은 저주는 풀리지 않는다', () => {
    const run = newRun();
    addCurse(run, 'weak');
    bagAdd(run, { id: 'old_photo', taint: 'frail' });
    bagDiscard(run, 0);
    expect(activeCurses(run)).toEqual(['weak']);
  });

  it('저주는 정해진 개수까지만 쌓인다', () => {
    const run = newRun();
    for (let i = 0; i < db.P('bag.curseMax') + 3; i++) addCurse(run, 'slow');
    expect(run.curses).toHaveLength(db.P('bag.curseMax'));
  });
});

describe('수상한 보따리의 선택', () => {
  it('평범한 보따리: 그냥 챙기면 안전하고, 뒤지면 한 등급 높은 것을 얻되 저주를 받을 수 있다', () => {
    const find = findOf('plain');
    const safe = resolveFind(newRun(), find, 'take', new Rng(1));
    expect(safe.item).toEqual({ id: find.item.id, taint: null });
    expect(safe.curse).toBeNull();

    let cursed = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const run = newRun();
      const res = resolveFind(run, find, 'dig', new Rng(seed));
      expect(db.valuable(res.item!.id).tier).toBe(Math.min(4, find.tier + 1));
      if (res.curse) {
        cursed++;
        expect(run.curses).toEqual([res.curse]);
      } else expect(run.curses).toEqual([]);
    }
    // 확률(50%)대로 대략 절반이 저주를 받는다
    expect(cursed).toBeGreaterThan(70);
    expect(cursed).toBeLessThan(130);
  });

  it('오염된 물건: 그대로 챙기면 비싸지만 들고 있는 동안 저주, 정화하면 체력을 잃는다', () => {
    const find = findOf('tainted');
    const run = newRun();
    const dirty = resolveFind(run, find, 'tainted', new Rng(1));
    expect(dirty.item!.taint).toBe(find.curse);
    expect(run.curses).toEqual([]);
    expect(valueOf(dirty.item!)).toBeGreaterThan(find.item.value);

    const clean = resolveFind(run, find, 'purify', new Rng(1));
    expect(clean.item!.taint).toBeNull();
    expect(clean.hpCost).toBeCloseTo(db.pct('bag.purifyHp'));

    const left = resolveFind(run, find, 'leave', new Rng(1));
    expect(left.item).toBeNull();
  });

  it('괴이의 거래: 확정 저주를 받고 두 등급 높은 것을 얻거나, 거절하고 작은 것만 줍는다', () => {
    const find = findOf('deal');
    const run = newRun();
    const res = resolveFind(run, find, 'deal', new Rng(1));
    expect(db.valuable(res.item!.id).tier).toBe(Math.min(4, find.tier + 2));
    expect(run.curses).toEqual([find.curse]);

    const other = newRun();
    const small = resolveFind(other, find, 'small', new Rng(1));
    expect(db.valuable(small.item!.id).tier).toBeLessThanOrEqual(Math.max(1, find.tier));
    expect(other.curses).toEqual([]);
  });

  it('깊은 섹터일수록 좋은 등급이 나온다', () => {
    const avg = (sector: number): number => {
      let sum = 0;
      for (let seed = 1; seed <= 400; seed++) sum += rollTier(new Rng(seed), sector);
      return sum / 400;
    };
    expect(avg(8)).toBeGreaterThan(avg(5));
    expect(avg(5)).toBeGreaterThan(avg(2));
    expect(rollValuable(new Rng(3), 4).tier).toBe(4);
  });
});

describe('던전 안의 보따리', () => {
  it('수색 오브젝트 가운데 수상한 보따리가 섞여 나오고, 열면 알림이 온다', () => {
    let seen = 0;
    for (let seed = 1; seed <= 12 && !seen; seed++) {
      const run = newRun();
      const rng = new Rng(seed);
      const w = new World(run, buildSector(run, db.sector(3), rng), rng);
      const t = w.things.find((x) => x.kind === 'stash');
      if (!t) continue;
      seen++;
      w.cheatInvuln = true;
      let opened = '';
      w.events.onThing = (thing) => (opened = thing.kind);
      w.party.x = t.x + 10;
      w.party.y = t.y + 10;
      w.update(1 / 60, emptyInput());
      const press = emptyInput();
      press.actions.push({ type: 'interact' });
      w.update(1 / 60, press);
      for (let i = 0; i < 80; i++) w.update(1 / 60, emptyInput());
      expect(opened).toBe('stash');
      expect(t.done).toBe(true);
    }
    expect(seen, '12개의 배치 가운데 보따리가 한 번도 나오지 않았다').toBeGreaterThan(0);
  });
});
