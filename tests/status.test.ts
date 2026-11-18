// 상태(버프·디버프) 표시 목록 검사: 무엇이 "핵심 상태"로 머리 위에 뜨고, 무엇이 왼쪽 위에만 뜨는지 (기획서 4.2절).
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { emptyInput } from '../src/game/input';
import { fieldStatus } from '../src/game/player/status';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { addCurse } from '../src/game/run/valuables';
import { World } from '../src/game/world/World';

/** team 의 첫 캐릭터가 필드에 있고 적이 없는 월드 */
function arena(team: string[]): World {
  const run = RunState.create(team, 'C', 'form');
  const rng = new Rng(7);
  const w = new World(run, buildSector(run, db.sector(1), rng), rng);
  w.cheatInvuln = true;
  for (const e of w.enemies) e.dead = true;
  w.enemies.length = 0;
  return w;
}

const step = (w: World, seconds: number): void => {
  for (let t = 0; t < seconds; t += 1 / 60) w.update(1 / 60, emptyInput());
};

describe('필드 캐릭터의 상태 목록', () => {
  it('대기 중인 팀원이 주는 상시 효과는 핵심 상태가 아니다', () => {
    // 키온(치명타), 로아(받는 피해 감소)가 대기 중일 때
    const w = arena(['serin', 'sia', 'roa']);
    step(w, 0.1);
    const list = fieldStatus(w);
    const crit = list.find((s) => s.id === 'aura.crit');
    const guard = list.find((s) => s.id === 'aura.guard');
    expect(crit).toBeTruthy();
    expect(guard).toBeTruthy();
    expect(crit!.key).toBe(false);
    expect(crit!.ratio).toBe(1);
    expect(list.filter((s) => s.key)).toEqual([]);
  });

  it('궁극기로 얻은 한정 강화와 속성 특성의 상태는 핵심 상태다', () => {
    const w = arena(['yuna', 'sia', 'roa']);
    const m = w.party.active;
    m.formStacks = 4;
    m.formT = db.P('attr.form.duration');
    m.addBuff({ id: 'yuna_over', label: '집중 포화', dur: 5, aspd: 1, key: true });
    // 장비가 주는 짧은 강화는 핵심 상태가 아니다
    m.addBuff({ id: 'c_ribbon', label: '질주', dur: 3, speed: 0.2 });
    const list = fieldStatus(w);
    const keys = list.filter((s) => s.key).map((s) => s.id);
    expect(keys).toEqual(['form', 'yuna_over']);
    expect(list.find((s) => s.id === 'form')!.stacks).toBe(4);
    expect(list.find((s) => s.id === 'yuna_over')!.icon).toBe('aspd');
    expect(list.find((s) => s.id === 'c_ribbon')!.key).toBe(false);
    // 핵심 상태가 앞에 온다
    expect(list.slice(0, 2).every((s) => s.key)).toBe(true);
  });

  it('저주는 디버프로 맨 뒤에 오고, 같은 저주가 겹치면 수를 센다', () => {
    const w = arena(['serin', 'mido', 'karen']);
    addCurse(w.run, 'frail');
    addCurse(w.run, 'frail');
    addCurse(w.run, 'slow');
    w.party.active.addBuff({ id: 'c_ribbon', label: '질주', dur: 3, speed: 0.2 });
    const list = fieldStatus(w);
    const frail = list.find((s) => s.id === 'curse.frail')!;
    expect(frail.bad).toBe(true);
    expect(frail.key).toBe(false);
    expect(frail.stacks).toBe(2);
    expect(frail.icon).toBe('guard');
    expect(list.find((s) => s.id === 'curse.slow')!.icon).toBe('speed');
    // 버프 → 디버프 순서
    expect(list.map((s) => s.bad)).toEqual([false, true, true]);
  });

  it('치명적인 디버프는 무엇보다 앞에 온다', () => {
    const w = arena(['serin', 'mido', 'karen']);
    const m = w.party.active;
    m.addBuff({ id: 'roa_ult', label: '진혼', dur: 5, atk: 0.2, key: true });
    m.addBuff({ id: 'burn', label: '화상', dur: 4, key: true, bad: true, icon: 'burn' });
    const list = fieldStatus(w);
    expect(list[0].id).toBe('burn');
    expect(list[0].bad && list[0].key).toBe(true);
    expect(list[1].id).toBe('roa_ult');
  });

  it('범위 안에 있는 동안 계속 갱신되는 효과는 남은 시간이 줄어드는 것처럼 보이지 않는다', () => {
    const w = arena(['eve', 'mido', 'karen']);
    const m = w.party.active;
    m.addBuff({ id: 'eve_flag', label: '깃발', dur: 0.5, atk: 0.1, key: true, icon: 'flag', steady: true });
    step(w, 0.3);
    const flag = fieldStatus(w).find((s) => s.id === 'eve_flag')!;
    expect(flag.ratio).toBe(1);
    expect(flag.icon).toBe('flag');
  });
});
