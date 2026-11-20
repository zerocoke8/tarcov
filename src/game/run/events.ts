// NPC 랜덤 이벤트 (기획서 7.6절). 섹터 안에서 NPC에게 다가가면 하나가 열린다.
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { World } from '../world/World';
import { equipName, upgradeRarity } from './equipment';
import { rerollUpgrade } from './rewards';

export interface EventResult {
  /** 결과 문장 */
  text: string;
  /** 이어서 3택 1을 연다 */
  reward?: { quality: number; minTier: number };
  /** 이어서 상점을 연다 */
  shop?: boolean;
}

export interface EventChoice {
  label: string;
  detail: string;
  disabled?: boolean;
  pick(w: World, rng: Rng): EventResult;
}

export interface NpcEvent {
  id: string;
  npc: string;
  text: string;
  choices: EventChoice[];
}

const leave = (label = '지나간다'): EventChoice => ({
  label,
  detail: '아무 일도 일어나지 않는다',
  pick: () => ({ text: '조용히 자리를 떠났다.' }),
});

type Builder = (w: World) => NpcEvent;

const EVENTS: { id: string; weight: number; build: Builder }[] = [
  {
    id: 'rescue',
    weight: 10,
    build: () => {
      const heal = db.P('event.rescue.heal');
      const shards = db.P('event.rescue.shards');
      return {
        id: 'rescue',
        npc: '길 잃은 조사원',
        text: '"살았다… 여기서 사람을 만날 줄이야. 도와줄 수 있는 게 있어요."',
        choices: [
          {
            label: '응급 처치를 받는다',
            detail: `팀 전원 체력 ${heal}% 회복`,
            pick: (w) => {
              for (const m of w.party.members) w.heal(m, (m.stats.maxHp * heal) / 100);
              return { text: '조사원이 능숙하게 상처를 살펴 주었다.' };
            },
          },
          {
            label: '정보를 받는다',
            detail: `이 섹터의 지도 전체 공개 + 괴담 조각 ${shards}`,
            pick: (w) => {
              w.revealAll();
              w.addShards(shards, w.party.x, w.party.y, 60);
              return { text: '조사원이 직접 그린 지도를 건네주었다.' };
            },
          },
        ],
      };
    },
  },
  {
    id: 'merchant',
    weight: 9,
    build: () => ({
      id: 'merchant',
      npc: '수상한 상인',
      text: '"좋은 물건 있어. 조각만 있으면 뭐든 내주지."',
      choices: [
        {
          label: '물건을 본다',
          detail: '괴담 조각으로 장비와 스킬 성장을 산다',
          pick: () => ({ text: '', shop: true }),
        },
        leave('사지 않는다'),
      ],
    }),
  },
  {
    id: 'altar',
    weight: 8,
    build: () => {
      const cost = db.P('event.altar.hpCost');
      return {
        id: 'altar',
        npc: '저주받은 제단',
        text: '검게 그을린 제단에서 낮은 속삭임이 들린다. 피를 바치면 무언가를 내줄 것 같다.',
        choices: [
          {
            label: '체력을 바친다',
            detail: `살아 있는 팀원 전원 체력 -${cost}% → 영웅 등급 이상 3택 1`,
            pick: (w) => {
              for (const m of w.party.members) {
                if (!m.dead) m.hp = Math.max(1, m.hp - (m.stats.maxHp * cost) / 100);
              }
              return { text: '제단이 붉게 빛나며 대가를 내놓았다.', reward: { quality: 3, minTier: 3 } };
            },
          },
          leave(),
        ],
      };
    },
  },
  {
    id: 'gambler',
    weight: 7,
    build: (w) => {
      const bet = db.P('event.gamble.bet');
      const chance = db.P('event.gamble.chance');
      const mult = db.P('event.gamble.mult');
      return {
        id: 'gambler',
        npc: '도박꾼 유령',
        text: '"한 판 어때? 이기면 크게 돌려주지. 지면… 뭐, 그런 거지."',
        choices: [
          {
            label: `괴담 조각 ${bet}을 건다`,
            detail: `${chance}% 확률로 ${Math.round(bet * mult)}을 돌려받는다`,
            disabled: w.run.shards < bet,
            pick: (world, rng) => {
              world.run.shards -= bet;
              if (rng.chance(chance / 100)) {
                world.addShards(Math.round(bet * mult), world.party.x, world.party.y, 60);
                return { text: '"쳇, 운이 좋군." 유령이 조각을 던져 주었다.' };
              }
              return { text: '"아쉽게 됐어." 유령이 낄낄대며 사라졌다.' };
            },
          },
          leave('거절한다'),
        ],
      };
    },
  },
  {
    id: 'smith',
    weight: 7,
    build: (w) => {
      const price = db.P('event.smith.price');
      const items = w.run.allItems().filter(({ item }) => item.rarity < db.rarities.length);
      return {
        id: 'smith',
        npc: '떠도는 대장장이',
        text: '"쓸 만한 장비를 갖고 있구먼. 조각을 내면 손봐 주지."',
        choices: [
          {
            label: `괴담 조각 ${price}을 낸다`,
            detail: items.length ? '희귀도가 가장 낮은 장비 1개의 희귀도 +1 (장비 스킬 레벨도 상승)' : '강화할 장비가 없다',
            disabled: w.run.shards < price || !items.length,
            pick: (world, rng) => {
              const lowest = Math.min(...items.map((i) => i.item.rarity));
              const target = rng.pick(items.filter((i) => i.item.rarity === lowest));
              world.run.shards -= price;
              upgradeRarity(target.item);
              world.refreshTeam();
              const r = db.rarity(target.item.rarity);
              return { text: `${db.char(target.charId).name}의 "${equipName(target.item)}"이(가) ${r.name} 등급이 되었다.` };
            },
          },
          leave('거절한다'),
        ],
      };
    },
  },
  {
    id: 'collector',
    weight: 6,
    build: (w) => {
      const owned = Object.keys(w.run.upgrades).length > 0;
      return {
        id: 'collector',
        npc: '괴담 수집가',
        text: '"네가 겪은 이야기, 나한테 하나 넘기지 않을래? 더 좋은 걸로 바꿔 줄게."',
        choices: [
          {
            label: '이야기를 넘긴다',
            detail: owned ? '스킬 성장 1개(1레벨)를 무작위 다른 성장 2레벨로 바꾼다' : '넘길 스킬 성장이 없다',
            disabled: !owned,
            pick: (world, rng) => {
              const res = rerollUpgrade(world.run, rng);
              if (!res) return { text: '수집가는 고개를 저었다. 바꿀 만한 것이 없었다.' };
              world.refreshTeam();
              return {
                text: `"${db.upgrade(res.from).name}"을(를) 넘기고 "${db.upgrade(res.to).name}"을(를) 얻었다.`,
              };
            },
          },
          leave('거절한다'),
        ],
      };
    },
  },
];

/** NPC를 만났을 때 그 이벤트가 나올 확률 (0~1). 선택지가 얼마나 자주 뜨는지 셀 때 쓴다 */
export function eventChance(id: string): number {
  const total = EVENTS.reduce((a, e) => a + e.weight, 0);
  return (EVENTS.find((e) => e.id === id)?.weight ?? 0) / total;
}

export function rollEvent(w: World, rng: Rng): NpcEvent {
  const picked = rng.weighted(EVENTS, (e) => e.weight) ?? EVENTS[0];
  return picked.build(w);
}
