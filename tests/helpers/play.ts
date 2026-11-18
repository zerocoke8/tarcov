// 런 전체를 화면 없이 자동으로 플레이하는 도우미 (테스트 공용)
import { Rng } from '../../src/core/rng';
import { rollEvent } from '../../src/game/run/events';
import { campRest, chooseRoute, onSectorClear } from '../../src/game/run/flow';
import { applyReward, rollChoices, type Reward } from '../../src/game/run/rewards';
import { RunState } from '../../src/game/run/RunState';
import { bagAdd, resolveFind, rollFind } from '../../src/game/run/valuables';
import { buildSector, currentSectorDef } from '../../src/game/run/sector';
import { rollShop } from '../../src/game/run/shop';
import { TILE } from '../../src/game/world/layout';
import { World } from '../../src/game/world/World';
import { runBot } from './bot';

/** 보상을 받는다. 장비는 그 슬롯이 비었거나 희귀도가 가장 낮은 캐릭터에게 준다 */
export function take(run: RunState, reward: Reward): void {
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

/** 진행이 멈췄을 때의 상황 (원인 파악용) */
export function describeStuck(w: World): string {
  const p = w.party;
  const tile = (x: number, y: number): string => `(${Math.floor(x / TILE)},${Math.floor(y / TILE)})`;
  const lines = [
    `파티 ${tile(p.x, p.y)} ${p.active.def.id} action=${p.action} anim=${p.anim} hp=${Math.round(p.active.hp)}`,
    '남은 적: ' +
      w.enemies
        .filter((e) => !e.dead)
        .map((e) => `${e.def.id}${tile(e.x, e.y)} ag=${e.aggro ? 1 : 0} ${e.state} hp=${e.hp} los=${w.los(p.x, p.y, e.x, e.y) ? 1 : 0}`)
        .join(' | '),
    '남은 것: ' +
      w.things
        .filter((t) => !t.done)
        .map((t) => `${t.kind}${tile(t.x, t.y)} lock=${t.locked ? 1 : 0}`)
        .join(' | '),
  ];
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  for (let y = ty - 6; y <= ty + 6; y++) {
    let row = '';
    for (let x = tx - 12; x <= tx + 12; x++) {
      const solid = x < 0 || y < 0 || x >= w.grid.w || y >= w.grid.h || w.grid.solid[y * w.grid.w + x];
      const enemy = w.enemies.some((e) => !e.dead && Math.floor(e.x / TILE) === x && Math.floor(e.y / TILE) === y);
      row += x === tx && y === ty ? '@' : enemy ? 'e' : solid ? '#' : '.';
    }
    lines.push(row);
  }
  return lines.join('\n');
}

export interface PlayResult {
  run: RunState;
  /** boss = 보스 격파, wipe = 전멸, stuck = 제한 시간 안에 섹터가 끝나지 않음 */
  outcome: 'boss' | 'wipe' | 'stuck';
  log: Record<string, unknown>[];
  /** 멈췄을 때의 상황 */
  stuck?: string;
}

/**
 * 편성부터 보스까지 한 런을 자동으로 플레이한다.
 * @param routeId 경로 선택에서 우선 고르는 경로 (없으면 첫 번째 선택지)
 */
export function playRun(seed: number, routeId: string, team: string[], petId: string): PlayResult {
  const rng = new Rng(seed);
  const run = RunState.create(team, petId, 'form');
  const log: Record<string, unknown>[] = [];

  for (let guard = 0; guard < 30; guard++) {
    const def = currentSectorDef(run);
    const setup = buildSector(run, def, rng);
    const w = new World(run, setup, rng);
    w.events.onThing = (t) => {
      if (t.kind === 'chest') {
        take(run, rollChoices(run, rng, t.quality)[0]);
        w.refreshTeam();
      } else if (t.kind === 'stash') {
        const find = rollFind(rng, run.sector);
        const res = resolveFind(run, find, find.options[0].id, rng);
        if (res.item) bagAdd(run, res.item);
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
    if (r.result === 'timeout') return { run, outcome: 'stuck', log, stuck: `섹터 ${def.index}\n${describeStuck(w)}` };
    if (r.result === 'wipe') return { run, outcome: 'wipe', log };

    if (def.type !== 'boss') take(run, rollChoices(run, rng, setup.route.quality)[0]);
    const res = onSectorClear(run, def, rng);
    if (res.camp) campRest(run);
    if (res.step.kind === 'end') break;
    if (res.step.kind === 'route') {
      const options = res.step.options;
      chooseRoute(run, options.find((o) => o.id === routeId) ?? options[0]);
    }
  }
  return { run, outcome: 'boss', log };
}
