// 시즌 장비 생성과 표시용 문구 (기획서 7.5절)
import type { Rng } from '../../core/rng';
import { db, trim } from '../../data/tables';
import { SLOTS, type OptStat, type Slot } from '../../data/types';
import type { EquipItem } from './RunState';

let uidSeq = 0;
const newUid = (): string => `${Date.now().toString(36)}-${(uidSeq++).toString(36)}`;

/** 보상 품질(1~3)에 맞는 희귀도를 뽑는다 */
export function rollRarity(rng: Rng, quality: number, min = 1): number {
  const q = Math.max(1, Math.min(3, quality)) - 1;
  const pool = db.rarities.filter((r) => r.rarity >= min);
  const picked = rng.weighted(pool, (r) => r.weights[q]) ?? pool[0];
  return picked.rarity;
}

/** 장비 하나를 만든다. 슬롯과 희귀도를 지정하지 않으면 무작위 */
export function rollEquip(rng: Rng, quality: number, slot?: Slot, rarity?: number): EquipItem {
  const s = slot ?? rng.pick(SLOTS);
  const r = rarity ?? rollRarity(rng, quality);
  const rdef = db.rarity(r);
  const skill = rng.pick(db.equipSkillList.filter((k) => k.slot === s));

  const pool = db.equipOptions.filter((o) => o.slot === s);
  const mains = pool.filter((o) => o.main);
  const chosen = [rng.pick(mains)];
  const rest = rng.shuffle(pool.filter((o) => !chosen.includes(o) && !chosen.some((c) => c.stat === o.stat)));
  while (chosen.length < rdef.options && rest.length) {
    const next = rest.pop()!;
    if (!chosen.some((c) => c.stat === next.stat)) chosen.push(next);
  }
  const opts = chosen.map((o) => ({
    stat: o.stat as OptStat,
    v: Math.round(rng.range(o.min, o.max) * rdef.optMult),
  }));
  return { uid: newUid(), slot: s, skill: skill.id, rarity: r, opts };
}

/** 희귀도를 한 단계 올린다 (대장장이). 장비 스킬 레벨이 오르고 옵션 수치도 비례해 오른다 */
export function upgradeRarity(item: EquipItem): boolean {
  const cur = db.rarity(item.rarity);
  const next = db.rarities.find((r) => r.rarity === item.rarity + 1);
  if (!next) return false;
  for (const o of item.opts) o.v = Math.round((o.v * next.optMult) / cur.optMult);
  item.rarity = next.rarity;
  return true;
}

export function equipName(item: EquipItem): string {
  return db.equipSkill(item.skill).name;
}

export function equipSkillText(item: EquipItem): string {
  return db.equipSkillDesc(item.skill, item.rarity);
}

export function optionText(stat: OptStat, v: number, slot: Slot): string {
  const def = db.equipOptions.find((o) => o.slot === slot && o.stat === stat) ?? db.equipOptions.find((o) => o.stat === stat);
  return (def?.label ?? `${stat} +{v}`).replace('{v}', String(trim(v)));
}

/** 희귀도가 반영된 장비 스킬의 대표 수치 */
export function skillValue(item: EquipItem): number {
  return db.equipSkill(item.skill).v1 * db.rarity(item.rarity).skillMult;
}
