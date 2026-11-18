// 귀중품과 가방 (기획서 7.12절).
// 던전에서 주운 귀중품은 칸 수가 정해진 가방에 담기고, 탈출하거나 보스를 쓰러뜨려 런을 끝내는 순간 던전 밖 재화(은화)로 바뀐다.
// 전멸하거나 포기하면 가방째 잃는다. 주울 때는 위험을 지고 더 좋은 것을 노릴지 골라야 한다.
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { ValuableDef } from '../../data/types';
import type { RunState } from './RunState';

/** 가방에 든 귀중품 한 개 */
export interface BagItem {
  id: string;
  /** 괴이에 오염된 물건이면 들고 있는 동안 걸리는 저주의 id */
  taint: string | null;
}

export const TIER_NAME = ['', '평범', '희귀', '진귀', '전설'];

/** 수상한 보따리를 열었을 때의 선택지 하나 */
export interface FindOption {
  id: 'take' | 'dig' | 'tainted' | 'purify' | 'deal' | 'small' | 'leave';
  label: string;
  desc: string;
  /** 위험이 따르는 선택인지 (화면에서 붉게 표시한다) */
  risky: boolean;
}

export interface Find {
  kind: 'plain' | 'tainted' | 'deal';
  title: string;
  text: string;
  /** 기본으로 들어 있는 물건의 등급 */
  tier: number;
  /** 오염된 물건·거래에서 미리 정해 둔 물건과 저주 */
  item: ValuableDef;
  curse: string;
  options: FindOption[];
}

export interface FindResult {
  /** 얻은 물건 (두고 갔으면 null) */
  item: BagItem | null;
  /** 런이 끝날 때까지 남는 저주를 새로 받았으면 그 id */
  curse: string | null;
  /** 팀 전원이 잃는 체력 비율 (0~1) */
  hpCost: number;
  text: string;
}

const depthBand = (sector: number): 'early' | 'mid' | 'late' => (sector <= 3 ? 'early' : sector <= 6 ? 'mid' : 'late');

/** 섹터 깊이에 따라 귀중품의 등급을 정한다. bonus만큼 등급을 올린다 (최대 4) */
export function rollTier(rng: Rng, sector: number, bonus = 0): number {
  const band = depthBand(sector);
  const tier = rng.weighted([1, 2, 3, 4], (t) => db.P(`bag.tier.${band}.t${t}`)) ?? 1;
  return Math.min(4, tier + bonus);
}

/** 그 등급의 귀중품 하나. 그 등급이 없으면 가까운 아래 등급에서 고른다 */
export function rollValuable(rng: Rng, tier: number): ValuableDef {
  for (let t = tier; t >= 1; t--) {
    const pool = db.valuableList.filter((v) => v.tier === t);
    const pick = rng.weighted(pool, (v) => v.weight);
    if (pick) return pick;
  }
  return db.valuableList[0];
}

const rollCurse = (rng: Rng): string => rng.pick(db.curseList).id;

/** 귀중품 하나의 가치(은화). 오염된 물건은 더 비싸다 */
export function valueOf(item: BagItem): number {
  const base = db.valuable(item.id).value;
  return Math.round(item.taint ? base * db.pct('bag.taintMult') : base);
}

export const bagValue = (run: RunState): number => run.bag.reduce((s, it) => s + valueOf(it), 0);
export const bagFull = (run: RunState): boolean => run.bag.length >= db.P('bag.slots');

/** 지금 걸려 있는 저주 전부: 런에 남은 저주 + 가방 속 오염된 물건의 저주 */
export function activeCurses(run: RunState): string[] {
  return [...run.curses, ...run.bag.flatMap((it) => (it.taint ? [it.taint] : []))];
}

/** 런이 끝날 때까지 남는 저주를 건다. 최대 개수를 넘으면 가장 오래된 것이 사라진다 */
export function addCurse(run: RunState, id: string): void {
  run.curses.push(id);
  const max = db.P('bag.curseMax');
  while (run.curses.length > max) run.curses.shift();
}

/** 가방에 넣는다. 가득 차 있으면 넣지 않고 false */
export function bagAdd(run: RunState, item: BagItem): boolean {
  if (bagFull(run)) return false;
  run.bag.push(item);
  return true;
}

/** 가방의 index번째 물건을 버린다 */
export function bagDiscard(run: RunState, index: number): BagItem | null {
  return run.bag.splice(index, 1)[0] ?? null;
}

/** 가방을 비우고 은화로 바꾼다. 바꾼 물건의 목록과 합계를 돌려준다 */
export function exchange(run: RunState): { items: { name: string; value: number; tier: number; taint: boolean }[]; total: number } {
  const items = run.bag.map((it) => ({ name: db.valuable(it.id).name, value: valueOf(it), tier: db.valuable(it.id).tier, taint: !!it.taint }));
  run.bag = [];
  return { items, total: items.reduce((s, it) => s + it.value, 0) };
}

/** 수상한 보따리를 열었을 때 무엇이 나오고 어떤 선택지가 있는지 정한다 */
export function rollFind(rng: Rng, sector: number, tierBonus = 0): Find {
  const kind = rng.weighted(['plain', 'tainted', 'deal'] as const, (k) => db.P(`bag.find.${k}`)) ?? 'plain';
  const tier = rollTier(rng, sector, tierBonus);
  const curse = rollCurse(rng);
  const c = db.curse(curse);
  const curseText = `${c.name} (${db.curseDesc(curse)})`;
  if (kind === 'tainted') {
    const item = rollValuable(rng, tier);
    return {
      kind,
      tier,
      item,
      curse,
      title: '오염된 물건',
      text: `${item.name}에 괴이의 기운이 배어 있다. 그대로 들고 나가면 값을 더 쳐주지만, 들고 있는 동안 몸이 상한다.`,
      options: [
        { id: 'tainted', label: '오염된 채로 챙긴다', desc: `가치 ${Math.round(item.value * db.pct('bag.taintMult'))} 은화. 들고 있는 동안 ${curseText}. 버리면 저주도 풀린다`, risky: true },
        { id: 'purify', label: '정화해서 챙긴다', desc: `가치 ${item.value} 은화. 팀 전원이 체력 ${db.P('bag.purifyHp')}%를 잃는다`, risky: false },
        { id: 'leave', label: '두고 간다', desc: '아무 일도 일어나지 않는다', risky: false },
      ],
    };
  }
  if (kind === 'deal') {
    const item = rollValuable(rng, Math.min(4, tier + 2));
    const small = rollValuable(rng, Math.max(1, tier - 1));
    return {
      kind,
      tier,
      item,
      curse,
      title: '괴이의 거래',
      text: `보따리 속에서 무언가가 속삭인다. 대가를 치르면 ${TIER_NAME[item.tier]} 등급의 물건을 내주겠다고 한다.`,
      options: [
        { id: 'deal', label: '대가를 치른다', desc: `${item.name} (${TIER_NAME[item.tier]}, ${item.value} 은화). 런이 끝날 때까지 ${curseText}`, risky: true },
        { id: 'small', label: '거절하고 굴러 나온 것만 줍는다', desc: `${small.name} (${TIER_NAME[small.tier]}, ${small.value} 은화)`, risky: false },
      ],
    };
  }
  const item = rollValuable(rng, tier);
  return {
    kind,
    tier,
    item,
    curse,
    title: '수상한 보따리',
    text: `${item.name}이(가) 들어 있다. 바닥에 무언가 더 있는 것 같지만, 손을 넣기가 꺼림칙하다.`,
    options: [
      { id: 'take', label: '보이는 것만 챙긴다', desc: `${item.name} (${TIER_NAME[item.tier]}, ${item.value} 은화)`, risky: false },
      { id: 'dig', label: '바닥까지 뒤진다', desc: `한 등급 높은 물건을 얻는다. ${db.P('bag.digChance')}% 확률로 런이 끝날 때까지 저주를 받는다`, risky: true },
    ],
  };
}

/**
 * 고른 선택지의 결과를 정한다. 런에 남는 저주는 여기서 걸고, 얻은 물건을 가방에 넣는 것은 부르는 쪽이 한다
 * (가방이 가득 찼을 때 무엇을 버릴지 물어야 하므로).
 */
export function resolveFind(run: RunState, find: Find, option: FindOption['id'], rng: Rng): FindResult {
  const none = { curse: null, hpCost: 0 };
  switch (option) {
    case 'take':
      return { ...none, item: { id: find.item.id, taint: null }, text: `${find.item.name}을(를) 챙겼다.` };
    case 'dig': {
      const better = rollValuable(rng, Math.min(4, find.tier + 1));
      const cursed = rng.chance(db.pct('bag.digChance'));
      if (cursed) addCurse(run, find.curse);
      return {
        item: { id: better.id, taint: null },
        curse: cursed ? find.curse : null,
        hpCost: 0,
        text: cursed
          ? `${better.name}을(를) 찾았다. 하지만 손끝이 시커멓게 물들었다: ${db.curse(find.curse).name}`
          : `${better.name}을(를) 찾았다. 아무 일도 일어나지 않았다.`,
      };
    }
    case 'tainted':
      return { ...none, item: { id: find.item.id, taint: find.curse }, text: `오염된 ${find.item.name}을(를) 챙겼다. 들고 있는 동안 ${db.curse(find.curse).name}.` };
    case 'purify':
      return { item: { id: find.item.id, taint: null }, curse: null, hpCost: db.pct('bag.purifyHp'), text: `기운을 걷어 내고 ${find.item.name}을(를) 챙겼다. 몸이 조금 상했다.` };
    case 'deal':
      addCurse(run, find.curse);
      return { item: { id: find.item.id, taint: null }, curse: find.curse, hpCost: 0, text: `${find.item.name}을(를) 받았다. 대가로 ${db.curse(find.curse).name}을(를) 얻었다.` };
    case 'small': {
      const small = rollValuable(rng, Math.max(1, find.tier - 1));
      return { ...none, item: { id: small.id, taint: null }, text: `${small.name}을(를) 주웠다.` };
    }
    default:
      return { ...none, item: null, text: '손대지 않고 지나쳤다.' };
  }
}
