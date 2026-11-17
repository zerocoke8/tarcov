// 성장 구입 (기획서 7.3절): 괴담 조각으로 특정 장비나 스킬 성장을 산다. 캠프와 상인 NPC에서 열린다.
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import { rollEquip } from './equipment';
import { availableUpgrades } from './rewards';
import type { EquipItem, RunState } from './RunState';

export type ShopItem =
  | { kind: 'upgrade'; id: string; price: number; sold: boolean }
  | { kind: 'equip'; item: EquipItem; price: number; sold: boolean }
  | { kind: 'heal'; price: number; sold: boolean };

export function rollShop(run: RunState, rng: Rng): ShopItem[] {
  const out: ShopItem[] = [{ kind: 'heal', price: db.P('shop.price.heal'), sold: false }];
  const slots = db.P('shop.slots');
  const upgrades = rng.shuffle(availableUpgrades(run));
  // 스킬 성장과 장비를 번갈아 진열한다
  for (let i = 0; out.length < slots; i++) {
    const u = i % 2 === 0 ? upgrades.pop() : undefined;
    if (u) {
      out.push({ kind: 'upgrade', id: u.id, price: db.P(`shop.price.upgrade.t${u.tier}`), sold: false });
    } else {
      const item = rollEquip(rng, 2);
      out.push({ kind: 'equip', item, price: db.P(`shop.price.equip.r${item.rarity}`), sold: false });
    }
  }
  return out;
}
