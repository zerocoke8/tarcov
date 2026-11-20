// 자동 공격 검사 (기획서 3.9절): 켜 두면 주변의 적을 스스로 상대하고, 직접 조작이 언제나 먼저다.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import type { Enemy } from '../src/game/enemy/Enemy';
import { emptyInput, type InputState } from '../src/game/input';
import { AutoPilot } from '../src/game/player/auto';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { FlowField } from '../src/game/world/flow';
import { TILE } from '../src/game/world/layout';
import { World } from '../src/game/world/World';

const HP = 1e9;
const DT = 1 / 60;

/** 선두 캐릭터가 lead 이고 적이 없는 월드 */
function arena(lead: string, sector = 1, seed = 5): World {
  const others = db.charList.filter((c) => c.id !== lead).slice(0, 2).map((c) => c.id);
  const run = RunState.create([lead, ...others], 'C', 'form');
  const rng = new Rng(seed);
  const w = new World(run, buildSector(run, db.sector(sector), rng), rng);
  w.cheatInvuln = true;
  for (const e of w.enemies) e.dead = true;
  w.enemies.length = 0;
  w.packs.length = 0;
  return w;
}

/** (x, y)에 움직이지 않는 허수아비를 세운다. aggro = 이쪽을 알아챈 상태인지 */
function dummy(w: World, x: number, y: number, aggro = true, id = 'wisp', grade = 0): Enemy {
  const e = w.spawnEnemy(id, grade, x, y);
  e.maxHp = e.hp = HP;
  e.stunT = 1e9;
  e.aggro = aggro;
  return e;
}

const lost = (e: Enemy): number => HP - e.hp;
const solid = (w: World, x: number, y: number): boolean => {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return tx < 0 || ty < 0 || tx >= w.grid.w || ty >= w.grid.h || !!w.grid.solid[ty * w.grid.w + tx];
};

/** 파티에서 dist 만큼 떨어지고 곧게 보이는 빈 자리 */
function openSpot(w: World, dist: number): { x: number; y: number } {
  const p = w.party;
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI) / 24;
    const x = p.x + Math.cos(a) * dist;
    const y = p.y + Math.sin(a) * dist;
    if (!solid(w, x, y) && w.clearShot(p.x, p.y, x, y, 14)) return { x, y };
  }
  throw new Error(`거리 ${dist}에 곧게 보이는 자리가 없습니다`);
}

/**
 * 파티와 적의 자리를 한 쌍 고른다: 곧은 거리는 maxDist 안이고, 걸어서 가는 길은 minSteps~maxSteps 걸음이며, 서로 보이지 않는다.
 * 파티를 그 자리로 옮기고 적의 자리를 돌려준다
 */
function wallSpot(w: World, maxDist: number, minSteps: number, maxSteps: number): { x: number; y: number } | null {
  const { w: gw, h: gh, solid: cells } = w.grid;
  const center = (i: number): { x: number; y: number } => ({ x: ((i % gw) + 0.5) * TILE, y: (Math.floor(i / gw) + 0.5) * TILE });
  const field = new FlowField(w.grid);
  for (let a = 0; a < gw * gh; a += 3) {
    if (cells[a]) continue;
    const pa = center(a);
    field.compute(pa.x, pa.y);
    for (let b = 0; b < gw * gh; b++) {
      if (cells[b]) continue;
      const pb = center(b);
      const d = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      if (d > maxDist || d < 150) continue;
      const steps = field.steps(pb.x, pb.y);
      if (steps < minSteps || steps > maxSteps) continue;
      if (w.los(pa.x, pa.y, pb.x, pb.y)) continue;
      w.party.x = pa.x;
      w.party.y = pa.y;
      return pb;
    }
  }
  return null;
}

/** seconds 초 동안 진행한다. input 은 플레이어가 누르고 있는 조작 */
function run(w: World, auto: AutoPilot, seconds: number, input: InputState = emptyInput()): void {
  for (let t = 0; t < seconds && !w.over; t += DT) {
    for (const e of w.enemies) if (e.maxHp === HP) e.stunT = 1e9;
    w.update(DT, auto.apply(w, input, DT));
  }
}

function pilot(on = true): AutoPilot {
  const a = new AutoPilot();
  a.on = on;
  return a;
}

/** params.csv 의 값 하나를 잠깐 바꿔서 fn 을 돌린다 */
function withParam(key: string, value: number, fn: () => void): void {
  const orig = db.P;
  db.P = (k: string): number => (k === key ? value : orig(k));
  try {
    fn();
  } finally {
    db.P = orig;
  }
}

describe('자동 공격', () => {
  it('꺼져 있으면 아무것도 하지 않는다 (플레이어의 입력을 그대로 넘긴다)', () => {
    const w = arena('sia');
    const s = openSpot(w, 200);
    const e = dummy(w, s.x, s.y);
    const auto = pilot(false);
    const input = emptyInput();
    expect(auto.apply(w, input, DT)).toBe(input);
    const { x, y } = w.party;
    run(w, auto, 2);
    expect(lost(e)).toBe(0);
    expect([w.party.x, w.party.y]).toEqual([x, y]);
    expect(auto.driving).toBe(false);
  });

  it('반경 안에 적이 없으면 제자리에 선다', () => {
    const w = arena('serin');
    const auto = pilot();
    const { x, y } = w.party;
    run(w, auto, 2);
    expect([w.party.x, w.party.y]).toEqual([x, y]);
    expect(w.party.anim).toBe('Idle');
    expect(auto.target).toBeNull();
    expect(auto.driving).toBe(true);
  });

  it('원거리 캐릭터: 사거리 안의 적은 그 자리에서 공격한다', () => {
    const w = arena('sia');
    const s = openSpot(w, 380);
    const e = dummy(w, s.x, s.y);
    const auto = pilot();
    const { x, y } = w.party;
    run(w, auto, 2.5);
    expect(lost(e)).toBeGreaterThan(0);
    expect(Math.hypot(w.party.x - x, w.party.y - y)).toBeLessThan(1);
    expect(auto.target).toBe(e);
  });

  it('근접 캐릭터: 반경 안의 적에게 다가가서 친다', () => {
    const w = arena('serin');
    const s = openSpot(w, 400);
    const e = dummy(w, s.x, s.y);
    const auto = pilot();
    const before = Math.hypot(e.x - w.party.x, e.y - w.party.y);
    run(w, auto, 4);
    const after = Math.hypot(e.x - w.party.x, e.y - w.party.y);
    expect(after).toBeLessThan(before - 150);
    // 닿는 거리에서 멈춘다 (적에게 겹칠 때까지 파고들지 않는다)
    expect(after - e.r).toBeLessThanOrEqual(w.party.active.range() + 1);
    expect(after).toBeGreaterThan(60);
    expect(lost(e)).toBeGreaterThan(0);
  });

  it('액티브 스킬은 준비되는 대로 쓰고, 궁극기는 쓰지 않는다', () => {
    const w = arena('serin');
    const s = openSpot(w, 120);
    dummy(w, s.x, s.y);
    const m = w.party.active;
    m.ult = db.P('ult.max');
    expect(m.charges).toBeGreaterThan(0);
    const auto = pilot();
    run(w, auto, 1.5);
    expect(m.charges).toBe(0);
    // 궁극기 게이지는 가득 찬 채로 남아 있다
    expect(m.ult).toBeGreaterThanOrEqual(db.P('ult.max'));
  });

  it('궁극기: 표의 값을 바꾸면 차는 대로, 또는 강한 적이 있을 때만 쓴다', () => {
    const cast = (mode: number, grade: number): boolean => {
      const w = arena('serin');
      const s = openSpot(w, 120);
      dummy(w, s.x, s.y, true, 'wisp', grade);
      const m = w.party.active;
      // 액티브를 먼저 쓰고 나서 궁극기 차례가 온다
      const auto = pilot();
      let used = false;
      withParam('auto.ult', mode, () => {
        m.ult = db.P('ult.max');
        run(w, auto, 3);
        used = m.ult < db.P('ult.max');
      });
      return used;
    };
    expect(cast(0, 1)).toBe(false);
    expect(cast(1, 0)).toBe(true);
    // 강한 적에게만: 일반 등급만 있으면 아끼고, 정예가 있으면 쓴다
    expect(cast(2, 0)).toBe(false);
    expect(cast(2, 1)).toBe(true);
  });

  it('자기 둘레에서 터지는 액티브(라이의 방출)는 적이 그 안에 들어왔을 때만 쓴다', () => {
    const far = arena('mido');
    const s1 = openSpot(far, 320);
    const e1 = dummy(far, s1.x, s1.y);
    run(far, pilot(), 2);
    expect(lost(e1)).toBeGreaterThan(0);
    expect(far.party.active.charges).toBeGreaterThan(0);

    const close = arena('mido');
    const s2 = openSpot(close, 110);
    dummy(close, s2.x, s2.y);
    run(close, pilot(), 1.5);
    expect(close.party.active.charges).toBe(0);
  });

  it('아직 알아채지 못한 적은 가까이 있을 때만 건드린다', () => {
    const w = arena('serin');
    const s = openSpot(w, 420);
    const e = dummy(w, s.x, s.y, false);
    const auto = pilot();
    const { x, y } = w.party;
    run(w, auto, 2);
    expect(auto.target).toBeNull();
    expect([w.party.x, w.party.y]).toEqual([x, y]);
    // 알아채면 상대한다
    e.aggro = true;
    run(w, auto, 0.5);
    expect(auto.target).toBe(e);

    const w2 = arena('serin');
    const s2 = openSpot(w2, 240);
    const e2 = dummy(w2, s2.x, s2.y, false);
    const auto2 = pilot();
    run(w2, auto2, 3);
    expect(lost(e2)).toBeGreaterThan(0);
  });

  it('반경 밖의 적은 알아챈 적이라도 쫓아가지 않는다', () => {
    const w = arena('serin', 4);
    const far = db.P('auto.radius') + 120;
    let s: { x: number; y: number } | null = null;
    try {
      s = openSpot(w, far);
    } catch {
      s = null;
    }
    if (!s) return;
    dummy(w, s.x, s.y);
    const auto = pilot();
    const { x, y } = w.party;
    run(w, auto, 2);
    expect(auto.target).toBeNull();
    expect([w.party.x, w.party.y]).toEqual([x, y]);
  });

  it('직접 이동하면 그것이 먼저다. 손을 떼면 바로 다시 자동으로 돌아온다', () => {
    const w = arena('serin');
    const s = openSpot(w, 120);
    const e = dummy(w, s.x, s.y);
    const auto = pilot();
    run(w, auto, 1);
    expect(lost(e)).toBeGreaterThan(0);

    // 적에게서 멀어지는 쪽으로 D패드를 누른다
    const a = (Math.round(Math.atan2(w.party.y - e.y, w.party.x - e.x) / (Math.PI / 4)) * Math.PI) / 4;
    const held = emptyInput();
    held.dirActive = true;
    held.dirX = Math.cos(a);
    held.dirY = Math.sin(a);
    expect(auto.apply(w, held, DT)).toBe(held);
    const d0 = Math.hypot(e.x - w.party.x, e.y - w.party.y);
    run(w, auto, 0.6, held);
    expect(auto.driving).toBe(false);
    // 진행 중이던 공격이 끝난 뒤로는 걷기만 한다
    expect(w.party.anim).toBe('Move');
    expect(Math.hypot(e.x - w.party.x, e.y - w.party.y)).toBeGreaterThan(d0 + 40);
    const hp = e.hp;
    run(w, auto, 0.3, held);
    expect(e.hp).toBe(hp);

    // 손을 떼면 다시 자동
    run(w, auto, 2.5);
    expect(auto.driving).toBe(true);
    expect(e.hp).toBeLessThan(hp);
  });

  it('회피와 공격 버튼도 직접 누른 것이 먼저다. 다른 버튼(교체)은 자동 중에도 그대로 듣는다', () => {
    const w = arena('serin');
    const s = openSpot(w, 120);
    dummy(w, s.x, s.y);
    const auto = pilot();
    run(w, auto, 0.5);

    const dodge = emptyInput();
    dodge.actions.push({ type: 'dodge' });
    expect(auto.apply(w, dodge, DT)).toBe(dodge);
    w.update(DT, dodge);
    expect(w.party.action).toBe('dodge');

    const attack = emptyInput();
    attack.attack = true;
    expect(auto.apply(w, attack, DT)).toBe(attack);

    // 교체는 자동을 끊지 않는다
    run(w, auto, 2);
    const swap = emptyInput();
    swap.actions.push({ type: 'swap', index: 1 });
    const out = auto.apply(w, swap, DT);
    expect(out).not.toBe(swap);
    w.update(DT, out);
    run(w, auto, 0.5);
    expect(w.party.cur).toBe(1);
    expect(auto.driving).toBe(true);
  });

  it('벽 뒤의 적: 가까운 길이 있으면 돌아가서 치고, 멀리 돌아가야 하면 쫓지 않는다', () => {
    // 가까운 길
    let found = 0;
    for (const sector of [2, 3, 4, 5]) {
      const w = arena('serin', sector);
      const s = wallSpot(w, 300, 4, 8);
      if (!s) continue;
      found++;
      const e = dummy(w, s.x, s.y);
      const auto = pilot();
      run(w, auto, 8);
      expect(lost(e), `섹터 ${sector}: 돌아가서 친다`).toBeGreaterThan(0);
      break;
    }
    expect(found).toBe(1);

    // 먼 길: 곧은 거리는 반경 안이지만 걸어가려면 한참 돌아야 한다
    let far = 0;
    for (const sector of [2, 3, 4, 5, 6, 7, 8]) {
      const w = arena('serin', sector);
      const limit = Math.ceil((db.P('auto.radius') * 1.5) / TILE) + 4;
      const s = wallSpot(w, 380, limit, 999);
      if (!s) continue;
      far++;
      const e = dummy(w, s.x, s.y);
      const auto = pilot();
      const { x, y } = w.party;
      run(w, auto, 2);
      expect(auto.target, `섹터 ${sector}`).toBeNull();
      expect([w.party.x, w.party.y]).toEqual([x, y]);
      expect(lost(e)).toBe(0);
      break;
    }
    expect(far).toBe(1);
  });

  it('무리 옆에 세워 두기만 해도 그 무리를 정리한다 (모든 캐릭터)', () => {
    for (const c of db.charList) {
      const others = db.charList.filter((x) => x.id !== c.id).slice(0, 2).map((x) => x.id);
      const run0 = RunState.create([c.id, ...others], 'C', 'form');
      const rng = new Rng(11);
      const w = new World(run0, buildSector(run0, db.sector(2), rng), rng);
      w.cheatInvuln = true;
      const pack = w.packs.find((p) => !p.gate)!;
      const first = pack.members[0];
      // 무리에서 조금 떨어진 곳에 세운다
      const spot = { x: first.x, y: first.y };
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const x = first.x + Math.cos(a) * 200;
        const y = first.y + Math.sin(a) * 200;
        if (!solid(w, x, y) && w.los(x, y, first.x, first.y)) {
          spot.x = x;
          spot.y = y;
          break;
        }
      }
      w.party.x = spot.x;
      w.party.y = spot.y;
      const auto = pilot();
      const input = emptyInput();
      for (let t = 0; t < 60 && !pack.cleared; t += DT) w.update(DT, auto.apply(w, input, DT));
      expect(pack.cleared, `${c.id}: 60초 안에 무리를 정리한다`).toBe(true);
    }
  });

  it('섹터가 끝났거나 전멸했으면 손을 뗀다', () => {
    const w = arena('serin');
    const s = openSpot(w, 120);
    dummy(w, s.x, s.y);
    const auto = pilot();
    run(w, auto, 0.5);
    expect(auto.driving).toBe(true);
    w.over = 'clear';
    const input = emptyInput();
    expect(auto.apply(w, input, DT)).toBe(input);
    expect(auto.driving).toBe(false);
  });
});
