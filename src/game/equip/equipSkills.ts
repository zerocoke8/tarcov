// 장비 스킬 (기획서 7.5절). 캐릭터 스킬과 무관하게 장비 자체로 작동한다.
//  - 무기: 공격할 때 (공격 사용 / 적중 / 치명타 / 처치)
//  - 방어구: 맞을 때 (피격 / 체력 저하 / 치명적 피해)
//  - 악세서리: 유틸 (교체 / 회피 / 스킬 사용 / 상시)
// 착용 캐릭터가 필드에 있을 때만 발동한다. "팀 공통" 스킬(수집가의 심볼, 탐지 귀걸이)은
// 월드가 run.teamSkillRarity()로 직접 확인한다.
import { db } from '../../data/tables';
import type { EquipSkillDef } from '../../data/types';
import type { Enemy } from '../enemy/Enemy';
import type { HitSpec } from '../entities';
import type { Member } from '../player/Member';
import type { EquipItem } from '../run/RunState';
import type { World } from '../world/World';
import { SEASON2_EQUIP } from './season2';

/** 캐릭터가 착용 중인 장비 1개의 전투 중 상태 */
export interface EquipInst {
  item: EquipItem;
  def: EquipSkillDef;
  /** 희귀도 배율이 반영된 대표 수치 */
  v1: number;
  /** 다음 발동까지 남은 시간 */
  cd: number;
  count: number;
  /** 섹터당 1회짜리 스킬을 이미 썼는지 */
  used: boolean;
}

export function makeInst(item: EquipItem): EquipInst {
  const def = db.equipSkill(item.skill);
  return { item, def, v1: def.v1 * db.rarity(item.rarity).skillMult, cd: 0, count: 0, used: false };
}

export interface EquipHandlers {
  /** 기본 공격을 사용할 때 */
  basic?(w: World, m: Member, q: EquipInst, aim: number): void;
  /** 기본 공격·액티브·궁극기가 적에게 맞았을 때 */
  hit?(w: World, m: Member, q: EquipInst, e: Enemy, h: HitSpec, dmg: number, crit: boolean): void;
  kill?(w: World, m: Member, q: EquipInst, e: Enemy): void;
  /** 피해를 받았을 때 */
  hurt?(w: World, m: Member, q: EquipInst, dmg: number, src: Enemy | null): void;
  /** 쓰러질 피해를 받았을 때. true를 돌려주면 쓰러지지 않는다 */
  fatal?(w: World, m: Member, q: EquipInst): boolean;
  swapIn?(w: World, m: Member, q: EquipInst): void;
  dodge?(w: World, m: Member, q: EquipInst): void;
  active?(w: World, m: Member, q: EquipInst): void;
  ult?(w: World, m: Member, q: EquipInst): void;
}

const equipHit = (m: Member, mult: number): HitSpec => ({ m, mult, kind: 'equip' });

export const EQUIP_SKILLS: Record<string, EquipHandlers> = {
  // ---- 무기: 공격할 때 추가 기능 ----
  w_crescent: {
    basic(w, m, q, aim) {
      if (++q.count < q.def.v2) return;
      q.count = 0;
      w.shoot({
        angle: aim,
        speed: 820,
        range: 460,
        r: 26,
        look: 'wave',
        color: 0xd9e4ff,
        pierce: -1,
        hit: equipHit(m, q.v1 / 100),
      });
    },
  },
  w_chain: {
    hit(w, m, q, e) {
      if (q.cd > 0 || !w.rng.chance(q.def.chance / 100)) return;
      q.cd = q.def.cooldown;
      const targets = w.enemies
        .filter((o) => !o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 230)
        .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))
        .slice(0, q.def.v2);
      if (!targets.length) targets.push(e);
      let fromX = e.x;
      let fromY = e.y - e.r;
      for (const t of targets) {
        w.fx.bolt(fromX, fromY, t.x, t.y - t.r, 0xfff2a8);
        w.hit(t, equipHit(m, q.v1 / 100), e.x, e.y);
        fromX = t.x;
        fromY = t.y - t.r;
      }
    },
  },
  w_blast: {
    hit(w, m, q, e, _h, _dmg, crit) {
      if (!crit || q.cd > 0) return;
      q.cd = q.def.cooldown;
      w.fx.blast(e.x, e.y, q.def.v2, 0xffb066, 0.25);
      w.areaHit(e.x, e.y, q.def.v2, equipHit(m, q.v1 / 100));
    },
  },
  w_bleed: {
    hit(_w, m, q, e) {
      // 초당 피해(중첩 1개당)를 적용 시점의 공격력으로 정한다
      e.addDebuff('bleed', q.def.v2, (m.atk() * q.v1) / 100, 3);
    },
  },
  w_wisp: {
    basic(w, m, q, aim) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      const n = q.def.v2;
      for (let i = 0; i < n; i++) {
        w.shoot({
          angle: aim + (i - (n - 1) / 2) * 0.55,
          speed: 520,
          range: 720,
          r: 9,
          look: 'orb',
          color: 0xb7a6ff,
          homing: 5,
          hit: equipHit(m, q.v1 / 100),
        });
      }
    },
  },
  w_slow: {
    hit(w, _m, q, e) {
      // 대상별 쿨타임
      const key = `slow:${q.item.uid}`;
      if (w.time < (e.vars[key] ?? 0)) return;
      e.vars[key] = w.time + q.def.cooldown;
      e.addDebuff('slow', q.def.v2, Math.min(0.8, q.v1 / 100));
    },
  },
  w_execute: {
    kill(_w, m, q) {
      m.addBuff({ id: 'w_execute', label: '처형', dur: q.def.v2, atk: q.v1 / 100, maxStacks: 3 });
    },
  },

  // ---- 방어구: 맞을 때 추가 기능 ----
  a_thorn: {
    hurt(w, m, q, _dmg, src) {
      if (q.cd > 0 || !src || src.dead) return;
      q.cd = q.def.cooldown;
      w.fx.bolt(w.party.x, w.party.y - 30, src.x, src.y - src.r, 0xff9d9d);
      w.hit(src, equipHit(m, q.v1 / 100));
    },
  },
  a_repel: {
    hurt(w, _m, q) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      const p = w.party;
      w.fx.ring(p.x, p.y, q.def.v2, 0xffe0a8, 0.3);
      w.shove(p.x, p.y, q.def.v2, 150, q.v1);
    },
  },
  a_shield: {
    hurt(w, m, q) {
      if (q.cd > 0 || m.hp <= 0 || m.hp > m.stats.maxHp * 0.4) return;
      q.cd = q.def.cooldown;
      m.shield = (m.stats.maxHp * q.v1) / 100;
      m.shieldT = q.def.v2;
      w.fx.ring(w.party.x, w.party.y, 60, 0x9fd8ff, 0.4);
      w.fx.label(w.party.x, w.party.y - 96, '비상 보호막', 0x9fd8ff);
    },
  },
  a_guts: {
    fatal(w, m, q) {
      if (q.used) return false;
      q.used = true;
      m.hp = 1;
      w.party.invulnT = Math.max(w.party.invulnT, q.v1);
      w.fx.ring(w.party.x, w.party.y, 80, 0xffd45a, 0.5);
      w.fx.label(w.party.x, w.party.y - 96, '불굴', 0xffd45a);
      return true;
    },
  },
  a_absorb: {
    hurt(_w, m, q, dmg) {
      m.addRegen((dmg * q.v1) / 100, q.def.v2);
    },
  },
  a_counter: {
    hurt(_w, m, q) {
      m.addBuff({ id: 'a_counter', label: '역습', dur: q.def.v2, atk: q.v1 / 100, maxStacks: 3 });
    },
  },
  a_blur: {
    hurt(_w, m, q) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      m.addBuff({ id: 'a_blur', label: '잔상', dur: q.v1, speed: q.def.v2 / 100 });
    },
  },

  // ---- 악세서리·심볼: 유틸 ----
  c_ribbon: {
    swapIn(w, m, q) {
      m.addBuff({ id: 'c_ribbon', label: '질주', dur: q.def.v2, speed: q.v1 / 100 });
      w.party.swapCd = Math.max(0, w.party.swapCd - 0.3);
    },
  },
  c_pendant: {
    dodge(_w, m, q) {
      m.reduceCooldown(q.v1);
    },
  },
  c_bell: {
    active(w, _m, q) {
      w.pet.cd = Math.max(0, w.pet.cd - q.v1);
    },
  },
  c_seal: {
    ult(_w, m, q) {
      const max = db.P('ult.max');
      m.ult = Math.min(max, m.ult + (max * q.v1) / 100);
    },
  },
  c_charm: {
    kill(w, m, q) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      w.heal(m, (m.stats.maxHp * q.v1) / 100);
    },
  },
  // 팀 공통 스킬은 월드가 직접 처리한다
  c_collector: {},
  c_radar: {},

  // ---- 시즌 2 ----
  ...SEASON2_EQUIP,
};
