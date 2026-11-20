// 한 런(시즌 하나를 끝까지)에서 "고르는 선택지"가 몇 번 뜨는지 센다. 전투는 돌리지 않고 섹터 구성만 뽑아서 센다.
// 전부 훑는 경우를 기준으로 한다: 무리를 모두 처치하고, 수색 오브젝트를 모두 열고, NPC에게 모두 말을 건다.
import { Rng } from '../../src/core/rng';
import { chestBudget } from '../../src/game/run/chests';
import { eventChance } from '../../src/game/run/events';
import { chooseRoute, onSectorClear } from '../../src/game/run/flow';
import { RunState } from '../../src/game/run/RunState';
import { buildSector, currentSectorDef } from '../../src/game/run/sector';

export interface ChoiceCount {
  /** 3택 1 보상: 무리를 처치해 나온 상자 */
  packChest: number;
  /** 3택 1 보상: 섹터 클리어 */
  clear: number;
  /** 3택 1 보상: 봉인 상자의 무리, 돌발 사건(난입, 떨어진 보급품)의 상자 */
  extraChest: number;
  /** 3택 1 보상: 저주받은 제단 (NPC를 만났을 때 제단이 나올 확률만큼) */
  altar: number;
  /** 경로 선택 */
  route: number;
  /** NPC 이벤트 */
  npc: number;
  /** 수상한 보따리 (어떻게 챙길지 고른다) */
  stash: number;
}

export const CHOICE_KEYS: (keyof ChoiceCount)[] = ['packChest', 'clear', 'extraChest', 'altar', 'route', 'npc', 'stash'];

/** 3택 1 보상이 뜨는 횟수 */
export const rewardsOf = (c: ChoiceCount): number => c.packChest + c.clear + c.extraChest + c.altar;
/** 고르는 선택지가 뜨는 횟수 전부 */
export const totalOf = (c: ChoiceCount): number => rewardsOf(c) + c.route + c.npc + c.stash;

/**
 * 그 시즌의 한 런에서 선택지가 뜨는 횟수.
 * @param routeId 경로 선택에서 고르는 경로 ('bonus' 면 보너스 맵이 나올 때마다 들른다)
 */
export function countChoices(season: number, seed: number, routeId = 'normal'): ChoiceCount {
  const rng = new Rng(seed);
  const run = RunState.create(['serin', 'mido', 'sia'], 'B', 'form', season);
  const c: ChoiceCount = { packChest: 0, clear: 0, extraChest: 0, altar: 0, route: 0, npc: 0, stash: 0 };
  for (let guard = 0; guard < 40; guard++) {
    const def = currentSectorDef(run);
    const setup = buildSector(run, def, rng);
    if (def.type !== 'boss') {
      c.packChest += chestBudget(setup.spawns.filter((s) => !s.gate).length, setup.chests);
      c.extraChest += setup.loot.filter((l) => l.kind === 'sealed').length;
      c.stash += setup.loot.filter((l) => l.kind === 'stash').length;
      if (setup.surprise?.id === 'ambush' || setup.surprise?.id === 'cache') c.extraChest++;
      if (setup.npc) {
        c.npc++;
        c.altar += eventChance('altar');
      }
      c.clear++;
    }
    const res = onSectorClear(run, def, rng);
    if (res.step.kind === 'end') break;
    if (res.step.kind === 'route') {
      c.route++;
      const options = res.step.options;
      chooseRoute(run, options.find((o) => o.id === routeId && !o.hidden) ?? options[0]);
    }
  }
  return c;
}

/** 여러 번 돌린 평균 */
export function averageChoices(season: number, runs: number, routeId = 'normal'): ChoiceCount {
  const sum: ChoiceCount = { packChest: 0, clear: 0, extraChest: 0, altar: 0, route: 0, npc: 0, stash: 0 };
  for (let i = 0; i < runs; i++) {
    const c = countChoices(season, 4000 + i * 13, routeId);
    for (const k of CHOICE_KEYS) sum[k] += c[k];
  }
  for (const k of CHOICE_KEYS) sum[k] /= runs;
  return sum;
}
