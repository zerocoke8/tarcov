// 조작 규칙 검사: 상호작용은 버튼을 눌러야 시작되고, 원거리 캐릭터는 D패드와 상관없이 자동 조준한다.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { emptyInput } from '../src/game/input';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';

function makeWorld(team: string[]): World {
  const run = RunState.create(team, 'B', 'form');
  const rng = new Rng(7);
  const w = new World(run, buildSector(run, db.sector(1), rng), rng);
  w.cheatInvuln = true;
  return w;
}

const step = (w: World, input = emptyInput(), frames = 1): void => {
  for (let i = 0; i < frames; i++) w.update(1 / 60, input);
};

describe('상호작용 버튼', () => {
  it('오브젝트 근처에 가도 자동으로 수색되지 않고, 버튼을 눌러야 시작된다', () => {
    const w = makeWorld(['serin', 'mido', 'sia']);
    const t = w.things.find((x) => x.kind !== 'exit' && x.kind !== 'chest' && x.kind !== 'npc')!;
    expect(t).toBeTruthy();
    w.party.x = t.x + 10;
    w.party.y = t.y + 10;
    step(w, emptyInput(), 120);
    expect(w.nearThing).toBe(t);
    expect(t.progress).toBe(0);
    expect(t.done).toBe(false);

    const press = emptyInput();
    press.actions.push({ type: 'interact' });
    step(w, press);
    expect(t.searching).toBe(true);
    // 수색 시간(0.8초)만큼 머무르면 끝난다
    step(w, emptyInput(), 70);
    expect(t.done).toBe(true);
    expect(w.nearThing).not.toBe(t);
  });

  it('수색 중에 범위를 벗어나면 취소되고, 다시 눌러야 한다', () => {
    const w = makeWorld(['serin', 'mido', 'sia']);
    const t = w.things.find((x) => x.kind !== 'exit' && x.kind !== 'chest' && x.kind !== 'npc')!;
    const home = { x: w.party.x, y: w.party.y };
    w.party.x = t.x + 10;
    w.party.y = t.y + 10;
    step(w);
    const press = emptyInput();
    press.actions.push({ type: 'interact' });
    step(w, press);
    step(w, emptyInput(), 20);
    expect(t.progress).toBeGreaterThan(0);
    w.party.x = home.x;
    w.party.y = home.y;
    step(w, emptyInput(), 60);
    expect(t.searching).toBe(false);
    expect(t.progress).toBe(0);
    expect(t.done).toBe(false);
  });

  it('멀리 있을 때는 버튼이 뜨지 않고, 눌러도 아무 일도 없다', () => {
    const w = makeWorld(['serin', 'mido', 'sia']);
    step(w);
    expect(w.nearThing).toBeNull();
    expect(w.interact()).toBe(false);
  });

  it('잠긴 출구에는 상호작용할 수 없고, 열린 출구는 버튼을 눌러야 섹터가 끝난다', () => {
    const w = makeWorld(['serin', 'mido', 'sia']);
    const exit = w.things.find((x) => x.kind === 'exit')!;
    w.party.x = exit.x;
    w.party.y = exit.y;
    step(w, emptyInput(), 5);
    expect(exit.locked).toBe(true);
    expect(w.nearThing).toBeNull();

    exit.locked = false;
    step(w, emptyInput(), 30);
    expect(w.over).toBeFalsy();
    expect(w.nearThing).toBe(exit);
    const press = emptyInput();
    press.actions.push({ type: 'interact' });
    step(w, press);
    expect(w.over).toBe('clear');
  });
});

describe('조준 방식', () => {
  it('캐릭터 표의 조준 방식: 근거리는 D패드, 원거리는 자동', () => {
    const aim = Object.fromEntries(db.charList.map((c) => [c.id, c.aim]));
    expect(aim).toMatchObject({ serin: 'dpad', raon: 'dpad', haru: 'dpad', eve: 'dpad', mido: 'auto', sia: 'auto', karen: 'auto', yuna: 'auto', roa: 'auto' });
  });

  /** 파티 왼쪽에 적 하나를 두고, D패드를 오른쪽으로 누른 채 공격한다 */
  function attackAwayFromEnemy(team: string[], autoAimAll = false): { facing: number; target: boolean } {
    const w = makeWorld(team);
    w.autoAimAll = autoAimAll;
    for (const e of w.enemies) e.dead = true;
    const p = w.party;
    const e = w.spawnEnemy('wisp', 0, p.x - 70, p.y);
    e.aggro = false;
    const input = emptyInput();
    input.dirActive = true;
    input.dirX = 1;
    input.attack = true;
    step(w, input, 3);
    return { facing: Math.cos(p.facing), target: p.autoTarget === e };
  }

  it('근거리 캐릭터는 D패드 방향으로 공격한다', () => {
    const r = attackAwayFromEnemy(['serin', 'mido', 'sia']);
    expect(r.facing).toBeGreaterThan(0.9);
    expect(r.target).toBe(false);
  });

  it('원거리 캐릭터는 D패드 방향과 상관없이 적을 자동 조준한다', () => {
    const r = attackAwayFromEnemy(['mido', 'serin', 'sia']);
    expect(r.target).toBe(true);
    expect(r.facing).toBeLessThan(-0.9);
  });

  it('디버그 옵션을 켜면 근거리 캐릭터도 자동 조준한다', () => {
    const r = attackAwayFromEnemy(['serin', 'mido', 'sia'], true);
    expect(r.target).toBe(true);
    expect(r.facing).toBeLessThan(-0.9);
  });

  it('사거리 안에 적이 없으면 원거리 캐릭터도 D패드 방향으로 쏜다', () => {
    const w = makeWorld(['mido', 'serin', 'sia']);
    for (const e of w.enemies) e.dead = true;
    const input = emptyInput();
    input.dirActive = true;
    input.dirY = 1;
    input.attack = true;
    step(w, input, 3);
    expect(Math.sin(w.party.facing)).toBeGreaterThan(0.9);
  });
});
