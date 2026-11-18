// 몬스터 동작 그림을 규칙의 시간에 맞춰 재생하기 위한 값 검사:
// 공격 동작의 길이와 타격 시점, 쓰러지는 시간, 보스의 전용 동작. 그리고 시즌 2 몬스터의 시트에 필요한 동작이 다 들어 있는지.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { DEATH_FADE } from '../src/game/entities';
import type { Enemy } from '../src/game/enemy/Enemy';
import { emptyInput } from '../src/game/input';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';
import { frameAt, resolveClip, type SheetData } from '../src/render/sprites/select';

const DT = 1 / 30;

function world(sector: number, seed = 3): World {
  const run = RunState.create(['serin', 'mido', 'sia'], 'B', 'form', 2);
  run.sector = sector;
  const rng = new Rng(seed);
  const w = new World(run, buildSector(run, db.sector(sector), rng), rng);
  w.cheatInvuln = true;
  return w;
}

function step(w: World, seconds: number): void {
  const input = emptyInput();
  for (let t = 0; t < seconds - 1e-9 && !w.over; t += DT) w.update(DT, input);
}

/** 조건이 맞을 때까지 진행한다 (최대 seconds 초) */
function until(w: World, seconds: number, ok: () => boolean): void {
  const input = emptyInput();
  for (let t = 0; t < seconds && !ok(); t += DT) w.update(DT, input);
  expect(ok(), '정해진 시간 안에 조건에 이르지 못했습니다').toBe(true);
}

/** 다른 몬스터를 치우고, 고른 몬스터 한 마리만 파티에서 dist 만큼 떨어진 자리에 세운다 */
function arena(id: string, dist: number): { w: World; e: Enemy } {
  const w = world(3);
  for (const o of w.enemies) w.kill(o, null, true);
  step(w, 2);
  const p = w.party;
  const pack = w.spawnPack({ x: p.x, y: p.y, gate: false, quality: 0, members: [{ def: db.monster(id), grade: 0 }] });
  const e = pack.members[0];
  // 벽에 막히지 않은 쪽에 세운다
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const x = p.x + Math.cos(a) * dist;
    const y = p.y + Math.sin(a) * dist;
    if (w.los(p.x, p.y, x, y)) {
      e.x = x;
      e.y = y;
      break;
    }
  }
  w.aggro(e);
  return { w, e };
}

describe('공격 동작의 길이와 타격 시점', () => {
  it.each(['tinman', 'lion'])('%s: 예고가 끝나는 순간이 타격 프레임이고, 내려친 뒤 자세를 푸는 동안에도 같은 동작이 이어진다', (id) => {
    const { w, e } = arena(id, 70);
    until(w, 6, () => e.state === 'windup');
    expect(e.anim).toBe('MonsterAttack');
    expect(e.animHit).toBeCloseTo(e.def.windup);
    expect(e.animDur).toBeCloseTo(e.def.windup + 0.7);
    until(w, 3, () => e.state === 'recover');
    expect(e.anim).toBe('MonsterAttack');
    expect(e.animT).toBeGreaterThan(e.def.windup - 0.1);
    expect(e.animT).toBeLessThan(e.animDur);
  });

  it('늑대: 예고 동안 웅크리고(동작의 앞부분), 예고가 끝나면 같은 동작으로 뛰어든다', () => {
    const { w, e } = arena('wolf', 150);
    until(w, 6, () => e.state === 'windup');
    expect(e.anim).toBe('MonsterAttack');
    expect(e.animHit).toBeCloseTo(e.def.windup);
    expect(e.animDur).toBeCloseTo(e.def.windup + e.def.p2 / e.def.p1);
    until(w, 3, () => e.state === 'act');
    expect(e.anim).toBe('MonsterAttack');
    expect(e.animT).toBeCloseTo(e.def.windup, 1);
  });

  it.each(['monkey', 'dwarf'])('%s: 던지는 순간이 타격 프레임이다', (id) => {
    const { w, e } = arena(id, db.monster(id).p2);
    until(w, 8, () => e.state === 'windup');
    expect(e.anim).toBe('MonsterAttack');
    expect(e.animHit).toBeCloseTo(e.def.windup);
    expect(e.animDur).toBeGreaterThan(e.def.windup);
  });

  it('허수아비: 예고 동안 몸을 감는 동작을 예고 길이에 맞춰 보여 주고, 도는 동안에는 도는 동작을 반복한다', () => {
    const { w, e } = arena('scarecrow', 50);
    until(w, 6, () => e.state === 'windup');
    expect(e.anim).toBe('MonsterAttack');
    expect(e.animDur).toBeCloseTo(e.def.windup);
    until(w, 3, () => e.state === 'act');
    expect(e.anim).toBe('Pattern');
    until(w, 3, () => e.state === 'recover');
    step(w, DT);
    expect(e.anim).toBe('Idle');
  });

  it('타격 프레임이 규칙의 타격 시점에 놓인다', () => {
    // 10장짜리 동작, 타격 지점 0.6: 예고 0.4초 + 돌진 0.36초
    const clip = { loop: false, fps: 12, impact: 0.6 };
    const dur = 0.76;
    expect(frameAt(clip, 10, 0, dur, 0.4)).toBe(0);
    expect(frameAt(clip, 10, 0.39, dur, 0.4)).toBe(5);
    expect(frameAt(clip, 10, 0.41, dur, 0.4)).toBe(6);
    expect(frameAt(clip, 10, 5, dur, 0.4)).toBe(9);
  });
});

describe('쓰러지는 동작', () => {
  it('쓰러지는 동작을 보여 준 뒤에 사라진다', () => {
    const { w, e } = arena('dwarf', 120);
    const time = db.P('enemy.deathTime');
    w.kill(e, null);
    expect(e.anim).toBe('Death');
    expect(e.deathT).toBeCloseTo(time);
    expect(e.animDur).toBeCloseTo(time - DEATH_FADE);
    step(w, time - 0.1);
    expect(w.enemies).toContain(e);
    step(w, 0.2);
    expect(w.enemies).not.toContain(e);
  });

  it('보스는 섹터가 끝날 때까지 쓰러진 채로 남는다', () => {
    const w = world(6, 11);
    const boss = w.enemies.find((e) => e.boss)!;
    w.kill(boss, null);
    expect(boss.deathT).toBeCloseTo(db.P('enemy.bossDeathTime'));
    step(w, 1.4);
    expect(w.enemies).toContain(boss);
    expect(w.over).toBeFalsy();
    step(w, 0.4);
    expect(w.over).toBe('clear');
  });
});

describe('마녀 인형의 동작', () => {
  it('페이즈 전환과 필살기는 전용 동작을 쓰고, 필살기 동작은 패턴 길이에 맞춘다', () => {
    const w = world(6, 11);
    const boss = w.enemies.find((e) => e.boss)!;
    w.party.x = boss.x - 200;
    w.party.y = boss.y;
    boss.hp = boss.maxHp * 0.3;
    until(w, 2, () => boss.anim === 'Phase');
    expect(boss.invuln).toBe(true);
    // 줄이 팽팽해지며 불길이 솟는 순간(타격 프레임)이 폭발 시점이다
    expect(boss.animHit).toBeCloseTo(1.6);
    until(w, 8, () => boss.anim === 'Finale');
    const P = (k: string): number => db.P(`witch.finale.${k}`);
    expect(boss.animDur).toBeCloseTo(0.6 + (P('count') - 1) * P('gap') + P('windup'));
    // 필살기가 끝나면 대기 동작으로 돌아온다
    until(w, 10, () => boss.anim !== 'Finale');
    expect(boss.state === 'recover' || boss.state === 'move').toBe(true);
  });

  it('불 던지기: 불이 나갈 때마다 내지르는 동작을 다시 맞춘다', () => {
    const w = world(6, 11);
    const boss = w.enemies.find((e) => e.boss)!;
    w.party.x = boss.x - 200;
    w.party.y = boss.y;
    // 1페이즈의 두 번째 패턴이 불 던지기다
    let shots = 0;
    let casts = 0;
    let prevT = 0;
    const input = emptyInput();
    for (let t = 0; t < 14; t += DT) {
      w.update(DT, input);
      if (boss.anim === 'Pattern' && boss.animHit > 0 && boss.animT < prevT) casts++;
      if (boss.anim === 'Pattern' && prevT === 0 && boss.animT > 0) casts++;
      prevT = boss.anim === 'Pattern' ? boss.animT : 0;
      shots = Math.max(shots, w.projectiles.filter((q) => q.team === 'enemy').length);
    }
    expect(shots).toBeGreaterThan(0);
    expect(casts).toBeGreaterThanOrEqual(2);
  });

  it('없는 동작은 가까운 동작으로 대신한다', () => {
    expect(resolveClip({ Idle: 1, Pattern: 1 }, 'Finale')).toBe('Pattern');
    expect(resolveClip({ Idle: 1, MonsterAttack: 1 }, 'Phase')).toBe('MonsterAttack');
    expect(resolveClip({ Idle: 1 }, 'Finale')).toBe('Idle');
  });
});

describe('시즌 2 몬스터의 시트', () => {
  const sheets = import.meta.glob<SheetData>('/public/sprites/*/sheet.json', { eager: true, import: 'default' });
  const sheet = (id: string): SheetData | undefined => Object.values(sheets).find((s) => s.id === id);
  /** 몬스터마다 규칙이 쓰는 동작 */
  const NEED: Record<string, string[]> = {
    scarecrow: ['Idle', 'Move', 'MonsterAttack', 'Pattern', 'Hit', 'Death'],
    tinman: ['Idle', 'Move', 'MonsterAttack', 'Hit', 'Death'],
    monkey: ['Idle', 'Move', 'MonsterAttack', 'Hit', 'Death'],
    wolf: ['Idle', 'Move', 'MonsterAttack', 'Hit', 'Death'],
    lion: ['Idle', 'Move', 'MonsterAttack', 'Hit', 'Death'],
    dwarf: ['Idle', 'Move', 'MonsterAttack', 'Hit', 'Death'],
    witch: ['Idle', 'Move', 'MonsterAttack', 'Pattern', 'Finale', 'Phase', 'Death'],
  };

  it.each(Object.keys(NEED))('%s: 규칙이 쓰는 동작이 모두 들어 있다', (id) => {
    const s = sheet(id);
    expect(s, `public/sprites/${id}/sheet.json`).toBeTruthy();
    expect(s!.kind).toBe('monster');
    for (const anim of NEED[id]) expect(s!.clips[anim], `${id} ${anim}`).toBeTruthy();
    expect(s!.clips.Idle.loop).toBe(true);
    expect(s!.clips.Move.loop).toBe(true);
    expect(s!.clips.Death.loop).toBe(false);
    // 공격 동작은 타격 지점이 있어야 예고 시간에 맞출 수 있다 (허수아비의 공격 동작은 몸을 감는 것뿐이라 타격 지점이 없다)
    if (id !== 'scarecrow') {
      const impact = s!.clips.MonsterAttack.impact ?? 0;
      expect(impact, `${id} 타격 지점`).toBeGreaterThan(0.15);
      expect(impact, `${id} 타격 지점`).toBeLessThan(0.9);
    }
  });

  it('허수아비가 도는 동작은 반복 동작이다', () => {
    expect(sheet('scarecrow')?.clips.Pattern?.loop).toBe(true);
  });
});
