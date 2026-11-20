// 교체 검사 (기획서 3.7절): 기본 공격이나 액티브 도중에도 누르는 즉시 바뀌고, 나가는 캐릭터가 하던 것은 마저 들어가며,
// 궁극기·회피 동작 중에 누른 교체는 그 동작이 끝나는 대로 이루어진다.
import { describe, expect, it } from 'vitest';
import { deg } from '../src/core/math';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import type { Enemy } from '../src/game/enemy/Enemy';
import { emptyInput, type InputAction } from '../src/game/input';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';
import { enterAlpha, enterLeft, ghostsDue, leapAlpha, leapUp, punchAmount } from '../src/render/swapMotion';

const HP = 1e9;
const DT = 1 / 120;

/** team 의 첫 캐릭터가 필드에 있고 적이 없는 월드 */
function arena(team: string[]): World {
  const run = RunState.create(team, 'C', 'form');
  const rng = new Rng(5);
  const w = new World(run, buildSector(run, db.sector(1), rng), rng);
  w.cheatInvuln = true;
  for (const e of w.enemies) e.dead = true;
  w.enemies.length = 0;
  w.packs.length = 0;
  return w;
}

/** 파티에서 곧게 보이는 빈 자리 (거리 dist) 에 움직이지 않는 허수아비를 세운다 */
function dummy(w: World, dist: number): Enemy {
  const p = w.party;
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI) / 24;
    const x = p.x + Math.cos(a) * dist;
    const y = p.y + Math.sin(a) * dist;
    if (!w.clearShot(p.x, p.y, x, y, 14)) continue;
    const e = w.spawnEnemy('wisp', 0, x, y);
    e.maxHp = e.hp = HP;
    e.stunT = 1e9;
    return e;
  }
  throw new Error('허수아비를 세울 자리가 없습니다');
}

const lost = (e: Enemy): number => Math.round(HP - e.hp);

/** seconds 초 동안 진행한다. 첫 프레임에만 actions 를 누르고, attack 은 내내 누르고 있는 것으로 한다 */
function run(w: World, seconds: number, actions: InputAction[] = [], attack = false): void {
  const input = emptyInput();
  input.attack = attack;
  input.actions.push(...actions);
  for (let t = 0; t < seconds && !w.over; t += DT) {
    for (const e of w.enemies) if (e.maxHp === HP) e.stunT = 1e9;
    w.update(DT, input);
  }
}

/** 기본 공격 한 번이 주는 피해 (교체하지 않고 끝까지 쳤을 때) */
function oneHit(team: string[], dist: number): number {
  const w = arena(team);
  const e = dummy(w, dist);
  run(w, DT, [], true);
  run(w, 1.2);
  return lost(e);
}

describe('교체', () => {
  it('공격을 휘두르는 도중에 눌러도 즉시 바뀌고, 나가는 캐릭터의 그 타격은 그대로 들어간다', () => {
    const team = ['serin', 'mido', 'sia'];
    const full = oneHit(team, 100);
    expect(full).toBeGreaterThan(0);

    const w = arena(team);
    const e = dummy(w, 100);
    const p = w.party;
    // 공격을 시작한다 (선딜 0.12초). 타격이 들어가기 전에 교체한다
    run(w, DT, [], true);
    run(w, 0.04);
    expect(p.action).toBe('attack');
    expect(lost(e)).toBe(0);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    // 누른 프레임에 바로 바뀐다
    expect(p.cur).toBe(1);
    expect(p.action).toBeNull();
    // 새 캐릭터는 아무것도 하지 않는다. 그래도 나간 캐릭터가 휘두르던 공격이 들어간다
    run(w, 0.5);
    expect(lost(e)).toBe(full);
  });

  it('타격이 이미 들어간 뒤(후딜 중)에 교체하면 더 들어가는 피해는 없다', () => {
    const team = ['serin', 'mido', 'sia'];
    const full = oneHit(team, 100);
    const w = arena(team);
    const e = dummy(w, 100);
    run(w, DT, [], true);
    run(w, 0.2);
    expect(lost(e)).toBe(full);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(w.party.cur).toBe(1);
    run(w, 0.6);
    expect(lost(e)).toBe(full);
  });

  it('원거리 캐릭터도 같다: 쏘려던 화살이 교체 뒤에 날아간다', () => {
    const team = ['sia', 'serin', 'mido'];
    const full = oneHit(team, 260);
    expect(full).toBeGreaterThan(0);
    const w = arena(team);
    const e = dummy(w, 260);
    run(w, DT, [], true);
    run(w, 0.05);
    expect(lost(e)).toBe(0);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(w.party.cur).toBe(1);
    run(w, 1);
    expect(lost(e)).toBe(full);
  });

  it('살려 둔 타격은 새 캐릭터가 회피해도 취소되지 않는다. 교체하지 않은 회피는 예전처럼 하던 공격을 끊는다', () => {
    const team = ['serin', 'mido', 'sia'];
    const full = oneHit(team, 100);
    const w = arena(team);
    const e = dummy(w, 100);
    run(w, DT, [], true);
    run(w, 0.03);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    run(w, DT, [{ type: 'dodge' }]);
    expect(w.party.action).toBe('dodge');
    run(w, 0.6);
    expect(lost(e)).toBe(full);

    const w2 = arena(team);
    const e2 = dummy(w2, 100);
    run(w2, DT, [], true);
    run(w2, 0.03);
    run(w2, DT, [{ type: 'dodge' }]);
    run(w2, 0.6);
    expect(lost(e2)).toBe(0);
  });

  it('들어온 캐릭터는 바로 조작할 수 있다', () => {
    const w = arena(['serin', 'mido', 'sia']);
    dummy(w, 200);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(w.party.cur).toBe(1);
    run(w, DT, [], true);
    expect(w.party.action).toBe('attack');
  });

  it('액티브를 쓰는 도중에 눌러도 즉시 바뀌고, 나가는 캐릭터의 액티브는 마저 들어간다 (캐릭터 9명 모두)', () => {
    for (const c of db.charList) {
      const others = db.charList.filter((x) => x.id !== c.id).slice(0, 2).map((x) => x.id);
      const team = [c.id, ...others];
      const dist = Math.min(120, c.range * 0.6);
      // 교체 없이 액티브만 썼을 때의 피해 (설치형은 오래 남으므로 넉넉히 지켜본다)
      const base = arena(team);
      const eb = dummy(base, dist);
      run(base, DT, [{ type: 'active' }]);
      run(base, 8);
      const full = lost(eb);

      const w = arena(team);
      const e = dummy(w, dist);
      const p = w.party;
      const charges = p.active.charges;
      run(w, DT, [{ type: 'active' }]);
      expect(p.active.charges, `${c.id}: 액티브를 썼다`).toBe(charges - 1);
      const moving = p.swapHeld;
      run(w, DT, [{ type: 'swap', index: 1 }]);
      if (!moving) {
        // 제자리에서 쓰는 액티브: 누른 프레임에 바로 바뀐다
        expect(p.cur, `${c.id}: 즉시 교체`).toBe(1);
      } else {
        // 돌진하는 액티브(카렌, 하루): 몸이 날아가는 동안에는 미뤘다가, 돌진이 끝나는 순간 바뀐다
        expect(['karen', 'haru'], c.id).toContain(c.id);
        expect(p.cur, `${c.id}: 돌진 중에는 아직`).toBe(0);
        expect(p.queuedSwap).toBe(1);
        run(w, 0.3);
        expect(p.cur, `${c.id}: 돌진이 끝나면 교체`).toBe(1);
      }
      run(w, 8);
      // 팀 구성에 따른 보정(오프 필드 효과)만큼의 차이는 있을 수 있다
      if (full > 0) {
        expect(lost(e), `${c.id}: 액티브의 피해가 들어간다`).toBeGreaterThan(full * 0.75);
        expect(lost(e), c.id).toBeLessThan(full * 1.3);
      } else expect(lost(e), c.id).toBe(0);
    }
  });

  it('돌진하는 액티브는 스킬이 다 끝나기 전에, 돌진이 끝나자마자 교체된다', () => {
    const w = arena(['karen', 'serin', 'mido']);
    dummy(w, 300);
    const p = w.party;
    run(w, DT, [{ type: 'active' }]);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    let at = -1;
    for (let t = 0; t < 1 && at < 0; t += DT) {
      w.update(DT, emptyInput());
      if (p.cur === 1) at = t;
    }
    expect(at).toBeGreaterThan(0.1);
    // 스킬의 행동 불가 시간(0.45초)이 끝나기를 기다리지 않는다
    expect(at).toBeLessThan(0.25);
    // 나간 캐릭터가 하던 동작의 남은 시간이 연출 정보에 들어 있다
    expect(p.leave?.index).toBe(0);
    expect(p.leave!.hold).toBeGreaterThan(0.1);
  });

  it('궁극기·회피 동작 중에 누르면 예약되고, 그 동작이 끝나는 대로 교체된다', () => {
    const team = ['serin', 'mido', 'sia'];
    const u = arena(team);
    dummy(u, 120);
    const p = u.party;
    p.active.ult = db.P('ult.max');
    run(u, DT, [{ type: 'ult' }]);
    expect(p.busy).toBe(true);
    run(u, DT, [{ type: 'swap', index: 2 }]);
    // 아직 바뀌지 않았고, 예약되어 있다
    expect(p.cur).toBe(0);
    expect(p.queuedSwap).toBe(2);
    // 동작이 끝나자마자 바뀐다
    let swappedAt = -1;
    for (let t = 0; t < 4 && swappedAt < 0; t += DT) {
      const busy = p.busy;
      u.update(DT, emptyInput());
      if (p.cur === 2) {
        swappedAt = t;
        // 바로 앞 프레임까지는 동작 중이었다
        expect(busy).toBe(true);
      }
    }
    expect(swappedAt).toBeGreaterThanOrEqual(0);
    expect(p.queuedSwap).toBe(-1);

    // 회피
    const d = arena(team);
    run(d, DT, [{ type: 'dodge' }]);
    run(d, DT, [{ type: 'swap', index: 1 }]);
    expect(d.party.cur).toBe(0);
    expect(d.party.queuedSwap).toBe(1);
    run(d, 0.6);
    expect(d.party.cur).toBe(1);
  });

  it('예약해 둔 교체는 그사이 다른 버튼을 눌러도 남는다', () => {
    const w = arena(['serin', 'mido', 'sia']);
    dummy(w, 120);
    w.party.active.ult = db.P('ult.max');
    run(w, DT, [{ type: 'ult' }]);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    run(w, DT, [{ type: 'pet' }]);
    run(w, DT, [{ type: 'interact' }]);
    expect(w.party.queuedSwap).toBe(1);
    run(w, 3.5);
    expect(w.party.cur).toBe(1);
  });

  it('교체 쿨타임 중에 누른 것은 예약되지 않는다 (예전과 같다)', () => {
    const w = arena(['serin', 'mido', 'sia']);
    const p = w.party;
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(p.cur).toBe(1);
    expect(p.swapCd).toBeGreaterThan(1);
    run(w, DT, [{ type: 'swap', index: 2 }]);
    expect(p.queuedSwap).toBe(-1);
    run(w, 0.6);
    expect(p.cur).toBe(1);
    // 쓰러진 캐릭터나 지금 캐릭터로는 스킬 중에 눌러도 예약되지 않는다
    run(w, 2);
    p.members[2].dead = true;
    p.active.ult = db.P('ult.max');
    run(w, DT, [{ type: 'ult' }]);
    expect(p.busy).toBe(true);
    run(w, DT, [{ type: 'swap', index: 2 }]);
    expect(p.queuedSwap).toBe(-1);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(p.queuedSwap).toBe(-1);
  });

  it('연출 정보: 나간 캐릭터, 하던 공격이 끝날 때까지 남은 시간, 나가고 들어오는 방향을 알려 준다', () => {
    const w = arena(['serin', 'mido', 'sia']);
    const p = w.party;
    const lane = deg(db.P('swap.lane'));
    const near = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    dummy(w, 100);
    const seq = p.swapSeq;
    run(w, DT, [], true);
    run(w, 0.05);
    const facing = p.facing;
    const remain = p.lock;
    expect(remain).toBeGreaterThan(0.2);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(p.swapSeq).toBe(seq + 1);
    expect(p.leave?.index).toBe(0);
    // 하던 공격 동작의 남은 시간만큼은 제자리에서 마저 보여 준다
    expect(p.leave!.hold).toBeCloseTo(remain - DT, 2);
    // 나가는 쪽은 뒤, 들어오는 쪽은 앞을 향하되 서로 옆으로 비껴 있다
    expect(near(p.leave!.dir, facing + Math.PI - lane)).toBeLessThan(1e-6);
    expect(near(p.enterDir, facing + lane)).toBeLessThan(1e-6);

    // 가만히 서 있다가 교체하면 기다리지 않고 바로 빠져나간다
    run(w, 2);
    run(w, DT, [{ type: 'swap', index: 2 }]);
    expect(p.swapSeq).toBe(seq + 2);
    expect(p.leave).toEqual({ index: 1, hold: 0, dir: p.leave!.dir, face: p.facing });
  });

  it('쓰러져서 바뀔 때는 나가는 연출이 없고, 새 캐릭터는 달려 들어온다', () => {
    const w = arena(['serin', 'mido', 'sia']);
    const p = w.party;
    run(w, DT, [{ type: 'swap', index: 1 }]);
    expect(p.leave).not.toBeNull();
    const seq = p.swapSeq;
    p.memberDown(w);
    expect(p.swapSeq).toBe(seq + 1);
    expect(p.leave).toBeNull();
    expect(p.active.dead).toBe(false);
  });

  it('캐릭터 9명 모두: 휘두르던 기본 공격이 교체 뒤에도 한 번 들어간다', () => {
    for (const c of db.charList) {
      const others = db.charList.filter((x) => x.id !== c.id).slice(0, 2).map((x) => x.id);
      const team = [c.id, ...others];
      const dist = Math.min(120, c.range * 0.6);
      const w = arena(team);
      const e = dummy(w, dist);
      run(w, DT, [], true);
      // 타격이 나가기 직전(선딜의 절반쯤)에 교체한다
      run(w, DT);
      expect(lost(e), `${c.id}: 아직 맞지 않았다`).toBe(0);
      run(w, DT, [{ type: 'swap', index: 1 }]);
      expect(w.party.cur, c.id).toBe(1);
      run(w, 1.2);
      expect(lost(e), `${c.id}: 나간 뒤에 타격이 들어간다`).toBeGreaterThan(0);
    }
  });
});

describe('교체 연출의 움직임', () => {
  it('들어오는 캐릭터: 뒤에서 시작해 빠르게 다가와 제자리에 멈춘다', () => {
    expect(enterLeft(0)).toBe(1);
    expect(enterLeft(1)).toBe(0);
    expect(enterLeft(2)).toBe(0);
    // 처음 절반에 대부분을 온다 (빠르게 다가와 느려진다)
    expect(enterLeft(0.5)).toBeLessThan(0.2);
    for (let i = 0; i < 10; i++) expect(enterLeft((i + 1) / 10)).toBeLessThan(enterLeft(i / 10));
    expect(enterAlpha(0)).toBeLessThan(0.5);
    expect(enterAlpha(0.4)).toBe(1);
  });

  it('나가는 캐릭터: 박차고 올라 느려지며, 높이 오르면서 사라진다', () => {
    expect(leapUp(0)).toBe(0);
    expect(leapUp(1)).toBe(1);
    expect(leapUp(0.5)).toBeGreaterThan(0.7);
    for (let i = 0; i < 10; i++) expect(leapUp((i + 1) / 10)).toBeGreaterThan(leapUp(i / 10));
    // 처음에는 또렷하다
    expect(leapAlpha(0)).toBe(1);
    expect(leapAlpha(0.25)).toBe(1);
    expect(leapAlpha(0.7)).toBeLessThan(0.5);
    expect(leapAlpha(1)).toBe(0);
  });

  it('화면 확대: 들어오는 동안 차오르고, 선 순간 가장 크고, 그 뒤 풀린다', () => {
    expect(punchAmount(0, 0)).toBe(0);
    expect(punchAmount(0.5, 0)).toBeGreaterThan(0);
    expect(punchAmount(0.5, 0)).toBeLessThan(punchAmount(0.9, 0));
    expect(punchAmount(1, 0)).toBe(1);
    expect(punchAmount(3, 0.1)).toBeLessThan(1);
    expect(punchAmount(3, 0.1)).toBeGreaterThan(0);
    expect(punchAmount(3, 1)).toBe(0);
  });

  it('잔상: 정한 수만큼 구간에 고르게 남긴다', () => {
    const at = (count: number): number[] => {
      const out: number[] = [];
      let n = 0;
      for (let i = 0; i <= 100; i++) {
        const due = ghostsDue(count, i / 100, 0.1, 0.7);
        while (n < due) {
          n++;
          out.push(i / 100);
        }
      }
      return out;
    };
    expect(at(3)).toEqual([0.1, 0.4, 0.7]);
    expect(at(2)).toEqual([0.1, 0.7]);
    expect(at(1)).toEqual([0.1]);
    expect(at(0)).toEqual([]);
  });

  it('연출 수치가 표에 있다', () => {
    for (const key of ['lane', 'enterTime', 'enterDist', 'exitTime', 'exitDist', 'exitBack', 'ghosts', 'stop', 'zoom']) expect(db.P(`swap.${key}`), key).toBeGreaterThanOrEqual(0);
    // 멈추는 시간은 눈에 띄되 조작이 끊기는 느낌이 들지 않을 만큼 짧아야 한다
    expect(db.P('swap.stop')).toBeLessThanOrEqual(0.1);
    expect(db.P('swap.zoom')).toBeLessThanOrEqual(8);
  });
});
