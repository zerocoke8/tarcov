// 런 전체(편성 → 9섹터 → 보스)를 화면 없이 자동으로 플레이해, 보상·장비·경로·캠프·보스 규칙이
// 끊기지 않고 이어지는지 확인한다.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { KITS } from '../src/game/player/kits';
import { rollEvent } from '../src/game/run/events';
import { campRest, chooseRoute, onSectorClear } from '../src/game/run/flow';
import { applyReward, rollChoices, type Reward } from '../src/game/run/rewards';
import { RunState } from '../src/game/run/RunState';
import { makeDeck } from '../src/game/run/save';
import { teamScore } from '../src/game/run/score';
import { buildSector, currentSectorDef } from '../src/game/run/sector';
import { rollShop } from '../src/game/run/shop';
import { World } from '../src/game/world/World';
import { runBot } from './helpers/bot';

/** 장비는 그 슬롯이 비었거나 희귀도가 가장 낮은 캐릭터에게 준다 */
function take(run: RunState, reward: Reward): void {
  if (reward.type === 'upgrade') {
    applyReward(run, reward);
    return;
  }
  const slot = reward.item.slot;
  const target = [...run.team].sort(
    (a, b) => (run.equipment[a.id]?.[slot]?.rarity ?? 0) - (run.equipment[b.id]?.[slot]?.rarity ?? 0),
  )[0];
  applyReward(run, reward, target.id);
}

function playRun(seed: number, routeId: string, team = ['serin', 'mido', 'sia'], petId = 'B') {
  const rng = new Rng(seed);
  const run = RunState.create(team, petId, 'form');
  const log: Record<string, unknown>[] = [];
  let outcome = 'boss';

  for (let guard = 0; guard < 30; guard++) {
    const def = currentSectorDef(run);
    const setup = buildSector(run, def, rng);
    const w = new World(run, setup, rng);
    w.events.onThing = (t) => {
      if (t.kind === 'chest') {
        take(run, rollChoices(run, rng, t.quality)[0]);
        w.refreshTeam();
      } else if (t.kind === 'npc') {
        const ev = rollEvent(w, rng);
        const choice = ev.choices.find((c) => !c.disabled) ?? ev.choices[ev.choices.length - 1];
        const res = choice.pick(w, rng);
        if (res.reward) take(run, rollChoices(run, rng, res.reward.quality, 3, res.reward.minTier)[0]);
        if (res.shop) {
          for (const item of rollShop(run, rng)) {
            if (item.kind === 'heal' || run.shards < item.price) continue;
            run.shards -= item.price;
            take(run, item.kind === 'upgrade' ? { type: 'upgrade', id: item.id } : { type: 'equip', item: item.item });
          }
        }
        w.refreshTeam();
      }
    };
    const r = runBot(w, 420);
    log.push({
      sector: def.type === 'bonus' ? '보너스' : def.index,
      route: setup.route.id,
      result: r.result,
      time: r.time,
      kills: r.kills,
      taken: r.taken,
      packs: r.packs,
      hp: w.party.members.map((m) => Math.round((m.hp / m.stats.maxHp) * 100) + '%').join(' '),
    });
    expect(r.result, `섹터 ${def.index} (${JSON.stringify(r)})`).not.toBe('timeout');
    if (r.result === 'wipe') {
      outcome = 'wipe';
      break;
    }
    if (def.type !== 'boss') take(run, rollChoices(run, rng, setup.route.quality)[0]);
    const res = onSectorClear(run, def, rng);
    if (res.camp) campRest(run);
    if (res.step.kind === 'end') break;
    if (res.step.kind === 'route') {
      const options = res.step.options;
      chooseRoute(run, options.find((o) => o.id === routeId) ?? options[0]);
    }
  }
  return { run, log, outcome };
}

describe('런 전체 자동 플레이', () => {
  it('캐릭터 9명이 모두 편성 가능하다', () => {
    expect(db.charList.length).toBe(9);
    for (const c of db.charList) expect(KITS[c.id], `${c.id}의 스킬 구현`).toBeDefined();
    // 고유 성장은 캐릭터마다 5개 이상
    for (const c of db.charList) {
      const n = db.upgradeList.filter((u) => u.category === 'unique' && u.owner === c.id).length;
      expect(n, `${c.id}의 고유 성장 수`).toBeGreaterThanOrEqual(5);
    }
  });

  it.each([
    [11, 'normal', ['serin', 'mido', 'sia'], 'B'],
    [12, 'elite', ['serin', 'mido', 'sia'], 'B'],
    [13, 'special', ['serin', 'mido', 'sia'], 'B'],
    [14, 'bonus', ['serin', 'mido', 'sia'], 'B'],
    [21, 'elite', ['karen', 'raon', 'yuna'], 'A'],
    [22, 'elite', ['haru', 'roa', 'eve'], 'C'],
    [23, 'special', ['yuna', 'roa', 'karen'], 'D'],
    [24, 'normal', ['eve', 'haru', 'raon'], 'B'],
  ] as const)('시드 %i, %s 경로, 팀 %j, 펫 %s — 끝까지 진행한다', (seed, routeId, team, petId) => {
    const { run, log, outcome } = playRun(seed, routeId, [...team], petId);
    const score = teamScore(run);
    console.table(log);
    console.log(
      `결과: ${outcome} · 클리어 섹터 ${run.cleared} · 팀 점수 ${score.total}`,
      score,
      `· 스킬 성장 ${Object.values(run.upgrades).reduce((a, b) => a + b, 0)}레벨 · 장비 ${run.allItems().length}개 · 조각 ${run.shards} · ${Math.round(run.time / 60)}분`,
    );
    // 저장 형태로 바꿨다가 되살려도 같은 런이어야 한다
    const restored = RunState.fromJSON(JSON.parse(JSON.stringify(run.toJSON())));
    expect(restored).not.toBeNull();
    expect(teamScore(restored!).total).toBe(score.total);
    if (outcome === 'boss') {
      expect(run.bossKilled).toBe(true);
      expect(run.cleared).toBe(db.lastSector);
      expect(makeDeck(run, 'boss').score).toBe(score.total);
    }
  });
});
