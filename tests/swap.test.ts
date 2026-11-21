// 교체 검사 (기획서 3.7절): 기본 공격이나 액티브 도중에도 누르는 즉시 바뀌고, 나가는 캐릭터가 하던 것은 마저 들어가며,
// 궁극기·회피 동작 중에 누른 교체는 그 동작이 끝나는 대로 이루어진다.
// 새 캐릭터는 등장 기술을 쓰며 나온다: 가까운 적을 겨누고, 근접 캐릭터는 그 앞까지 뛰어든다.
import { describe, expect, it } from 'vitest';
import { deg } from '../src/core/math';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import type { Enemy } from '../src/game/enemy/Enemy';
import { emptyInput, type InputAction } from '../src/game/input';
import type { Kit } from '../src/game/player/kit';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';

const HP = 1e9;
const DT = 1 / 120;

/**
 * team 의 첫 캐릭터가 필드에 있고 적이 없는 월드.
 * entry 가 false 면 등장 기술을 뺀다: 교체 규칙만 볼 때는 새 캐릭터가 아무것도 하지 않아야 피해를 가려낼 수 있다
 */
function arena(team: string[], entry = false): World {
  const run = RunState.create(team, 'C', 'form');
  const rng = new Rng(5);
  const w = new World(run, buildSector(run, db.sector(1), rng), rng);
  w.cheatInvuln = true;
  for (const e of w.enemies) e.dead = true;
  w.enemies.length = 0;
  w.packs.length = 0;
  if (!entry) for (const m of w.party.members) (m as { kit: Kit }).kit = { ...m.kit, entry: undefined };
  return w;
}

/** 파티에서 room 거리까지 곧게 트인 방향 (rad) */
function openDir(w: World, room: number): number {
  const p = w.party;
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI) / 24;
    if (w.clearShot(p.x, p.y, p.x + Math.cos(a) * room, p.y + Math.sin(a) * room, 14)) return a;
  }
  throw new Error('트인 방향이 없습니다');
}

/** 파티에서 곧게 보이는 빈 자리 (거리 dist) 에 움직이지 않는 허수아비를 세운다. room 을 주면 그 거리까지 트인 방향에 세운다 */
function dummy(w: World, dist: number, room = dist): Enemy {
  const p = w.party;
  const a = openDir(w, room);
  const e = w.spawnEnemy('wisp', 0, p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist);
  e.maxHp = e.hp = HP;
  e.stunT = 1e9;
  return e;
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

/** 등장 기술로 적 앞까지 뛰어드는 근접 캐릭터 */
const MELEE = ['serin', 'raon', 'haru', 'eve'];
/** 제자리에서 등장 기술을 쓰는 캐릭터와, 그 기술이 닿는 거리(px) */
const IN_PLACE: Record<string, number> = { mido: 120, sia: 260, karen: 150, yuna: 260, roa: 260 };
/** 캐릭터마다 들어오는 모습 */
const STYLE: Record<string, string> = { serin: 'rush', haru: 'rush', eve: 'rush', sia: 'rush', raon: 'drop', mido: 'drop', karen: 'roll', yuna: 'roll', roa: 'blink' };

/** who 가 두 번째 자리에 있는 팀 (필드에는 다른 캐릭터가 나와 있다) */
function teamWith(who: string): string[] {
  const others = db.charList.filter((c) => c.id !== who).map((c) => c.id);
  return [others[0], who, others[1]];
}

const moved = (w: World, sx: number, sy: number): number => Math.hypot(w.party.x - sx, w.party.y - sy);
const near = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

describe('등장 기술', () => {
  it('교체하면 아무것도 누르지 않아도 새 캐릭터가 등장 기술을 쓴다 (캐릭터 9명 모두)', () => {
    expect(Object.keys(STYLE).sort()).toEqual(db.charList.map((c) => c.id).sort());
    for (const c of db.charList) {
      const w = arena(teamWith(c.id), true);
      const e = dummy(w, MELEE.includes(c.id) ? 250 : IN_PLACE[c.id]);
      const p = w.party;
      run(w, DT, [{ type: 'swap', index: 1 }]);
      expect(p.active.def.id).toBe(c.id);
      // 기본 공격과 같은 취급이다
      expect(p.action, c.id).toBe('attack');
      expect(lost(e), `${c.id}: 아직 맞지 않았다`).toBe(0);
      run(w, 1.5);
      expect(lost(e), `${c.id}: 등장 기술이 맞는다`).toBeGreaterThan(0);
      // 약한 피해다 (기본 공격 한 번쯤. 치명타·약점을 쳐도 공격력의 몇 배를 넘지 않는다)
      expect(lost(e), c.id).toBeLessThan(p.active.atk() * 5);
      expect(p.action, `${c.id}: 끝나면 풀린다`).toBeNull();
    }
  });

  it('근접 캐릭터는 겨눈 적 앞으로 뛰어든다. 멀어도 정해진 거리까지만 가고, 겨눌 적이 없으면 반걸음만 내딛는다', () => {
    const lunge = db.P('swap.entryLunge');
    for (const id of MELEE) {
      const w = arena(teamWith(id), true);
      const p = w.party;
      const sx = p.x;
      const sy = p.y;
      const e = dummy(w, 250);
      const aim = Math.atan2(e.y - sy, e.x - sx);
      run(w, DT, [{ type: 'swap', index: 1 }]);
      run(w, 1);
      expect(moved(w, sx, sy), `${id}: 다가갔다`).toBeGreaterThan(60);
      expect(moved(w, sx, sy), id).toBeLessThanOrEqual(lunge + 1);
      // 적 쪽으로 곧게 갔고, 적의 몸 안에 서지 않는다
      expect(near(Math.atan2(p.y - sy, p.x - sx), aim), id).toBeLessThan(0.01);
      expect(Math.hypot(e.x - p.x, e.y - p.y), id).toBeGreaterThan(e.r);
      expect(lost(e), id).toBeGreaterThan(0);

      // 적이 없으면 바라보던 쪽으로 반걸음
      const empty = arena(teamWith(id), true);
      const ex = empty.party.x;
      const ey = empty.party.y;
      run(empty, DT, [{ type: 'swap', index: 1 }]);
      expect(empty.party.action, id).toBe('attack');
      run(empty, 1);
      expect(moved(empty, ex, ey), `${id}: 반걸음`).toBeLessThanOrEqual(db.P('swap.entryStep') + 1);
    }
  });

  it('하루는 가까운 적을 베며 지나쳐 그 뒤에 선다', () => {
    const w = arena(teamWith('haru'), true);
    const p = w.party;
    const sx = p.x;
    const sy = p.y;
    const e = dummy(w, 120, 320);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    run(w, 1);
    // 처음 자리에서 보아 적보다 멀리 가 있다
    expect(moved(w, sx, sy)).toBeGreaterThan(120 + e.r);
    expect(lost(e)).toBeGreaterThan(0);
  });

  it('원거리 캐릭터는 제자리에서 쓴다', () => {
    for (const id of Object.keys(IN_PLACE)) {
      const w = arena(teamWith(id), true);
      const sx = w.party.x;
      const sy = w.party.y;
      dummy(w, IN_PLACE[id]);
      run(w, DT, [{ type: 'swap', index: 1 }]);
      run(w, 1);
      expect(moved(w, sx, sy), id).toBeLessThan(1e-6);
    }
  });

  it('적이 없어도 쓴다: 누르고 있던 방향 패드 쪽을 겨누고, 그동안 이동은 멈췄다가 끝나면 다시 움직인다', () => {
    const w = arena(teamWith('sia'), true);
    const p = w.party;
    const a = openDir(w, 300);
    const input = emptyInput();
    input.dirActive = true;
    input.dirX = Math.cos(a);
    input.dirY = Math.sin(a);
    input.actions.push({ type: 'swap', index: 1 });
    w.update(DT, input);
    expect(p.active.def.id).toBe('sia');
    expect(p.action).toBe('attack');
    expect(near(p.facing, a)).toBeLessThan(1e-6);
    const sx = p.x;
    const sy = p.y;
    const lock = db.sv('sia.entry.lock');
    for (let t = 0; t < lock - 0.05; t += DT) w.update(DT, input);
    expect(moved(w, sx, sy)).toBe(0);
    for (let t = 0; t < 0.3; t += DT) w.update(DT, input);
    expect(p.action).toBeNull();
    expect(moved(w, sx, sy)).toBeGreaterThan(20);
  });

  it('회피로 끊으면 타격이 나가지 않는다', () => {
    for (const id of ['serin', 'yuna']) {
      const w = arena(teamWith(id), true);
      const e = dummy(w, 150);
      run(w, DT, [{ type: 'swap', index: 1 }]);
      run(w, DT, [{ type: 'dodge' }]);
      expect(w.party.action, id).toBe('dodge');
      run(w, 1);
      expect(lost(e), id).toBe(0);
    }
  });

  it('나가는 캐릭터가 하던 공격과 새 캐릭터의 등장 기술이 함께 들어간다', () => {
    const team = ['serin', 'mido', 'sia'];
    const full = oneHit(team, 100);
    const w = arena(team, true);
    const e = dummy(w, 100);
    run(w, DT, [], true);
    run(w, 0.04);
    run(w, DT, [{ type: 'swap', index: 1 }]);
    // 라이의 전격이 터지기 전: 에트나가 휘두르던 타격만 들어갔다
    run(w, 0.11);
    expect(lost(e)).toBe(full);
    run(w, 1);
    expect(lost(e)).toBeGreaterThan(full);
  });

  it('쓰러져서 바뀔 때도 등장 기술을 쓴다', () => {
    const w = arena(['serin', 'mido', 'sia'], true);
    const p = w.party;
    const e = dummy(w, 120);
    p.memberDown(w);
    expect(p.cur).toBe(1);
    expect(p.leave).toBeNull();
    expect(p.action).toBe('attack');
    run(w, 1);
    expect(lost(e)).toBeGreaterThan(0);
  });

  it('연출 정보: 겨눈 쪽, 들어오는 모습, 들어오는 데 걸리는 시간을 알려 준다', () => {
    const lane = deg(db.P('swap.lane'));
    for (const c of db.charList) {
      const w = arena(teamWith(c.id), true);
      const p = w.party;
      const e = dummy(w, 150);
      const aim = Math.atan2(e.y - p.y, e.x - p.x);
      run(w, DT, [{ type: 'swap', index: 1 }]);
      expect(near(p.facing, aim), c.id).toBeLessThan(1e-6);
      expect(p.enterStyle, c.id).toBe(STYLE[c.id]);
      // 첫 타격이 나가는 때에 맞춰 들어온다
      expect(p.enterTime, c.id).toBeCloseTo(db.sv(`${c.id}.entry.windup`), 6);
      expect(p.animHit, c.id).toBeCloseTo(p.enterTime, 6);
      // 겨눈 쪽의 뒤에서 들어온다. 키온만 앞에서 물러나며 들어온다
      expect(near(p.enterDir, c.id === 'sia' ? aim + Math.PI : aim + lane), c.id).toBeLessThan(1e-6);
    }
  });
});
