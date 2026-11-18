// 테스트용 조사 팀 (data/test_decks.csv). 도전 모드를 바로 시험해 볼 수 있게, 런을 돌지 않고도 쓸 수 있는 빌드를 만든다.
// 빌드는 실제 런과 같은 규칙으로 만든다: 3택 1 보상을 정해진 횟수만큼 뽑아 첫 번째 것을 받는다.
// 난수의 씨앗이 표에 적혀 있으므로 언제 만들어도 같은 빌드가 나온다.
import { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { TestDeckDef } from '../../data/types';
import { applyReward, rollChoices } from './rewards';
import { RunState } from './RunState';
import { makeDeck, type Deck } from './save';

export function buildTestDeck(def: TestDeckDef): Deck {
  const rng = new Rng(def.seed);
  const run = RunState.create(def.team, def.pet, 'form', def.season);
  for (let i = 0; i < def.picks; i++) {
    const reward = rollChoices(run, rng, def.quality)[0];
    if (reward.type === 'upgrade') applyReward(run, reward);
    else {
      // 장비는 그 슬롯이 비었거나 희귀도가 가장 낮은 캐릭터에게 준다
      const slot = reward.item.slot;
      const target = [...run.team].sort((a, b) => (run.equipment[a.id]?.[slot]?.rarity ?? 0) - (run.equipment[b.id]?.[slot]?.rarity ?? 0))[0];
      applyReward(run, reward, target.id);
    }
  }
  run.cleared = def.cleared;
  run.routeScore = def.routeScore;
  run.bossKilled = def.outcome === 'boss';
  return { ...makeDeck(run, def.outcome), id: def.id, savedAt: 0, name: def.name, test: true };
}

let cache: Deck[] | null = null;

/** 테스트용 조사 팀 전부. 한 번 만들면 다시 만들지 않는다 */
export function testDecks(): Deck[] {
  if (!cache) {
    // 빌드를 만드는 동안 시즌이 바뀌므로 (시즌마다 나오는 보상이 다르다) 끝나면 되돌린다
    const season = db.seasonId;
    cache = db.testDecks.map(buildTestDeck);
    db.useSeason(season);
  }
  return cache;
}
