// 업그레이드 선택 (기획서 7.3절): 3택 1의 선택지를 뽑고 적용한다
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { UpgradeDef } from '../../data/types';
import { rollEquip, rollRarity } from './equipment';
import type { EquipItem, RunState } from './RunState';

export type Reward = { type: 'upgrade'; id: string } | { type: 'equip'; item: EquipItem };

/** 지금 팀이 얻을 수 있는(해당하고, 최대 레벨이 아닌) 스킬 성장 */
export function availableUpgrades(run: RunState): UpgradeDef[] {
  const positions = new Set(run.team.map((m) => db.char(m.id).position));
  return db.upgradeList.filter((u) => {
    if (run.lv(u.id) >= u.max) return false;
    if (u.category === 'unique') return run.has(u.owner);
    // 시즌 스킬은 그 시즌의 것만 나온다
    if (u.category === 'season') return u.season === run.season && (u.owner === 'team' || positions.has(u.owner as never));
    return true;
  });
}

function pickUpgrade(run: RunState, rng: Rng, quality: number, pool: UpgradeDef[], taken: Set<string>, minTier = 1): UpgradeDef | null {
  const q = Math.max(1, Math.min(3, quality));
  const candidates = pool.filter((u) => !taken.has(u.id) && u.tier >= minTier);
  const picked = rng.weighted(candidates, (u) => db.P(`reward.tier.q${q}.t${u.tier}`));
  return picked ?? null;
}

/**
 * 3택 1 선택지를 뽑는다. 보통 고유 스킬 1 + 시즌(또는 펫) 스킬 1 + 장비 1로 구성하고,
 * 뽑을 것이 모자란 분류는 다른 분류로 채운다.
 * @param quality 보상 품질 1~3. 높을수록 높은 등급이 나온다
 * @param minTier 스킬 성장의 최소 등급 (영웅 이상 보장 등)
 */
export function rollChoices(run: RunState, rng: Rng, quality: number, count = 3, minTier = 1): Reward[] {
  const all = availableUpgrades(run);
  const unique = all.filter((u) => u.category === 'unique');
  const season = all.filter((u) => u.category !== 'unique');
  const taken = new Set<string>();
  const out: Reward[] = [];

  const addUpgrade = (pool: UpgradeDef[]): boolean => {
    const u = pickUpgrade(run, rng, quality, pool, taken, minTier) ?? pickUpgrade(run, rng, quality, pool, taken);
    if (!u) return false;
    taken.add(u.id);
    out.push({ type: 'upgrade', id: u.id });
    return true;
  };
  const addEquip = (): void => {
    const minRarity = minTier >= 3 ? 3 : minTier >= 2 ? 2 : 1;
    out.push({ type: 'equip', item: rollEquip(rng, quality, undefined, rollRarity(rng, quality, minRarity)) });
  };

  if (!addUpgrade(unique)) addUpgrade(season) || addEquip();
  if (!addUpgrade(season)) addUpgrade(unique) || addEquip();
  addEquip();
  while (out.length < count) {
    if (rng.chance(0.5) || !addUpgrade(all)) addEquip();
  }
  return rng.shuffle(out.slice(0, count));
}

/**
 * 선택한 보상을 런에 적용한다.
 * @param charId 장비를 장착할 캐릭터 (장비 보상일 때 필요)
 * @returns 장비를 교체했다면 기존 장비를 환산한 괴담 조각 수
 */
export function applyReward(run: RunState, reward: Reward, charId?: string): number {
  if (reward.type === 'upgrade') {
    run.addUpgrade(reward.id);
    return 0;
  }
  if (!charId) throw new Error('장비를 장착할 캐릭터가 지정되지 않았습니다');
  const old = run.equip(charId, reward.item);
  if (!old) return 0;
  // 장비 교체: 기존 장비는 컨텐츠 재화로 환산
  const refund = db.rarity(old.rarity).refund;
  run.shards += refund;
  return refund;
}

/** 스킬 성장 하나를 무작위로 다른 성장으로 바꾸고 레벨을 1 더한다 (괴담 수집가) */
export function rerollUpgrade(run: RunState, rng: Rng): { from: string; to: string } | null {
  const owned = Object.keys(run.upgrades).filter((id) => run.lv(id) > 0);
  if (!owned.length) return null;
  const from = rng.pick(owned);
  const pool = availableUpgrades(run).filter((u) => u.id !== from);
  if (!pool.length) return null;
  const to = rng.pick(pool);
  run.upgrades[from]--;
  if (run.upgrades[from] <= 0) delete run.upgrades[from];
  run.addUpgrade(to.id, 2);
  return { from, to: to.id };
}
