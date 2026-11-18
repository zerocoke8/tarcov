// 궁극기의 작용 방식 검사. 캐릭터마다 범위의 모양과 방식이 달라야 한다 (원형으로 터지는 것 일색이 되지 않게).
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import type { Enemy } from '../src/game/enemy/Enemy';
import { emptyInput } from '../src/game/input';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';

const HP = 1e9;

/** 선두 캐릭터만 있고 적이 없는 월드. 궁극기 게이지는 가득 차 있다 */
function arena(lead: string): World {
  const others = db.charList.filter((c) => c.id !== lead).slice(0, 2).map((c) => c.id);
  const run = RunState.create([lead, ...others], 'C', 'form');
  const rng = new Rng(5);
  const w = new World(run, buildSector(run, db.sector(1), rng), rng);
  w.cheatInvuln = true;
  for (const e of w.enemies) e.dead = true;
  w.enemies.length = 0;
  w.party.active.ult = db.P('ult.max');
  return w;
}

/** 파티 기준 (dx, dy) 위치에 움직이지 않는 허수아비를 세운다 */
function dummy(w: World, dx: number, dy: number): Enemy {
  const e = w.spawnEnemy('wisp', 0, w.party.x + dx, w.party.y + dy);
  e.maxHp = e.hp = HP;
  e.stunT = 1e9;
  return e;
}

const lost = (e: Enemy): number => HP - e.hp;

/** 오른쪽을 보고 궁극기를 쓴 뒤 seconds 초 동안 진행한다 */
function castUlt(w: World, seconds: number, attack = false): void {
  const input = emptyInput();
  input.dirActive = true;
  input.dirX = 1;
  input.actions.push({ type: 'ult' });
  w.update(1 / 60, input);
  const hold = emptyInput();
  hold.attack = attack;
  for (let t = 0; t < seconds; t += 1 / 60) {
    for (const e of w.enemies) e.stunT = 1e9;
    w.update(1 / 60, hold);
  }
}

describe('궁극기', () => {
  it('에트나 · 붕괴 일섬: 전방으로 길게 뻗는 직선. 옆과 뒤는 맞지 않고, 균열이 남아 계속 피해를 준다', () => {
    const w = arena('serin');
    const near = dummy(w, 80, 0);
    const far = dummy(w, 180, 0);
    const side = dummy(w, 60, 170);
    const back = dummy(w, -120, 0);
    castUlt(w, 0.6);
    const first = lost(far);
    expect(lost(near)).toBeGreaterThan(0);
    expect(first).toBeGreaterThan(0);
    expect(lost(side)).toBe(0);
    expect(lost(back)).toBe(0);
    // 남은 균열 위에 서 있으면 더 맞는다
    castUlt(w, 2);
    expect(lost(far)).toBeGreaterThan(first);
  });

  it('라이 · 뇌운: 흩어진 적을 하나씩 골라 친다. 적이 하나뿐이면 다시 치되 피해가 줄어든다', () => {
    const w = arena('mido');
    const spots: [number, number][] = [
      [200, 0],
      [-200, 0],
      [0, 60],
      [0, -60],
      [150, 60],
      [-150, -50],
    ];
    const all = spots.map(([x, y]) => dummy(w, x, y));
    castUlt(w, 2.5);
    for (const e of all) expect(lost(e), `(${Math.round(e.x)}, ${Math.round(e.y)})의 적`).toBeGreaterThan(0);

    const solo = arena('mido');
    const one = dummy(solo, 150, 0);
    castUlt(solo, 2.5);
    const many = arena('mido');
    const a = dummy(many, 150, 0);
    dummy(many, -200, 0);
    dummy(many, 0, 60);
    dummy(many, 0, -60);
    dummy(many, 150, 60);
    dummy(many, -150, -50);
    dummy(many, -60, 50);
    dummy(many, 220, 60);
    castUlt(many, 2.5);
    // 혼자 다 맞아도 여덟 발을 온전히 맞은 것보다는 적게 맞는다
    expect(lost(one)).toBeGreaterThan(lost(a));
    expect(lost(one)).toBeLessThan(lost(a) * db.sv('mido.ult.count') * 0.7);
  });

  it('카렌 · 반전 폭발: 코앞의 부채꼴을 여러 번 친다. 뒤는 맞지 않고, 끝나면 액티브가 돌아온다', () => {
    const w = arena('karen');
    const front = dummy(w, 140, 0);
    const back = dummy(w, -140, 0);
    const farAway = dummy(w, 330, 0);
    w.party.active.charges = 0;
    castUlt(w, 0.25);
    const oneShot = lost(front);
    castUlt(w, 1.2);
    expect(oneShot).toBeGreaterThan(0);
    expect(lost(front)).toBeGreaterThan(oneShot * 3);
    expect(lost(back)).toBe(0);
    expect(lost(farAway)).toBe(0);
    expect(w.party.active.charges).toBe(w.party.active.maxCharges());
  });

  it('로아 · 백귀 진혼: 팀을 회복하고, 표식이 붙은 적만 잠시 뒤에 한꺼번에 맞는다', () => {
    const w = arena('roa');
    const m = w.party.members[1];
    m.hp = m.stats.maxHp * 0.5;
    const a = dummy(w, 220, 0);
    const b = dummy(w, -260, 40);
    castUlt(w, 0.8);
    expect(m.hp).toBeGreaterThan(m.stats.maxHp * 0.5);
    // 아직 터지기 전
    expect(lost(a)).toBe(0);
    expect(lost(b)).toBe(0);
    castUlt(w, db.sv('roa.ult.delay') + 0.3);
    expect(lost(a)).toBeGreaterThan(0);
    expect(lost(b)).toBeGreaterThan(0);
  });

  it('이브 · 진군 나팔: 직접 피해는 없고, 팀을 강화한 뒤 공격할 때마다 창이 함께 날아간다', () => {
    const w = arena('eve');
    const far = dummy(w, 220, 0);
    castUlt(w, 1.2);
    // 나팔 자체로는 피해가 없다
    expect(lost(far)).toBe(0);
    expect(w.party.active.statusIcons().some((s) => s.label === '진군')).toBe(true);
    // 공격하는 동안에는 창이 닿지 않는 거리의 적에게도 협공 창이 날아간다
    castUlt(w, 2, true);
    expect(lost(far)).toBeGreaterThan(0);
  });

  it('원형으로 터지는 궁극기는 한 명뿐이다', () => {
    const text = (id: string): string => db.skillDesc(id, 'ult');
    const circles = db.charList.filter((c) => /원형|대범위/.test(text(c.id)));
    expect(circles.map((c) => c.id)).toEqual(['raon']);
  });
});
