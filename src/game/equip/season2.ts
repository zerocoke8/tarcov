// 시즌 2 "소원을 삼키는 나라"의 장비 스킬 (equipment_skills.csv 의 season = 2).
// 규칙은 시즌 1과 같다: 무기는 공격할 때, 방어구는 맞을 때, 악세서리는 유틸.
import { db } from '../../data/tables';
import type { HitSpec } from '../entities';
import type { Member } from '../player/Member';
import type { EquipHandlers } from './equipSkills';

const equipHit = (m: Member, mult: number): HitSpec => ({ m, mult, kind: 'equip' });

export const SEASON2_EQUIP: Record<string, EquipHandlers> = {
  // ---- 무기 ----
  /** 나무꾼의 도끼날: 기본 공격 v2회마다 조준 방향 앞을 내려찍는다 */
  w2_axe: {
    basic(w, m, q, aim) {
      if (++q.count < q.def.v2) return;
      q.count = 0;
      const x = w.party.x + Math.cos(aim) * 78;
      const y = w.party.y + Math.sin(aim) * 78;
      w.after(0.12, () => {
        w.fx.play('equip.axe', x, y, { size: 84, angle: aim });
        w.areaHit(x, y, 84, equipHit(m, q.v1 / 100), w.party.x, w.party.y);
      });
    },
  },
  /** 독포자 탄: 적중 시 확률로 그 자리에 독 안개 */
  w2_spore: {
    hit(w, m, q, e) {
      if (q.cd > 0 || !w.rng.chance(q.def.chance / 100)) return;
      q.cd = q.def.cooldown;
      const perSec = (m.atk() * q.v1) / 100;
      w.fx.play('spore.burst', e.x, e.y, { size: 90 });
      w.addZone({
        look: 'spore',
        team: 'party',
        x: e.x,
        y: e.y,
        r: 90,
        dur: q.def.v2,
        color: 0x9be36a,
        tick: 0.5,
        onTick: (z) => {
          for (const o of w.enemies) if (!o.dead && Math.hypot(o.x - z.x, o.y - z.y) <= z.r + o.r) o.addDebuff('poison', 1, perSec);
        },
      });
    },
  },
  /** 불씨 지팡이: 치명타 시 화상 */
  w2_ember: {
    hit(_w, m, q, e, _h, _dmg, crit) {
      if (crit) e.addDebuff('burn', q.def.v2, (m.atk() * q.v1) / 100);
    },
  },
  /** 검은 깃털: 일정 시간마다 다음 공격에 관통하는 깃털을 부채꼴로 쏜다 */
  w2_feather: {
    basic(w, m, q, aim) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      const n = q.def.v2;
      for (let i = 0; i < n; i++) {
        w.shoot({
          angle: aim + (i - (n - 1) / 2) * 0.2,
          speed: 760,
          range: 520,
          r: 8,
          look: 'feather',
          color: 0x8a6cff,
          pierce: -1,
          hit: equipHit(m, q.v1 / 100),
        });
      }
    },
  },
  /** 꼭두각시 줄: 적중 시 대상을 줄로 묶어 느리게 한다 (대상별 쿨타임) */
  w2_strings: {
    hit(w, _m, q, e) {
      const key = `strings:${q.item.uid}`;
      if (w.time < (e.vars[key] ?? 0)) return;
      e.vars[key] = w.time + q.def.cooldown;
      e.addDebuff('slow', q.def.v2, Math.min(0.8, q.v1 / 100));
      w.fx.bolt(w.party.x, w.party.y - 30, e.x, e.y - e.r, 0xe8e2ff);
    },
  },
  /** 핀 조명: 같은 적을 이어서 공격할수록 공격력이 오른다. 대상이 바뀌면 사라진다 */
  w2_spot: {
    hit(_w, m, q, e) {
      if (m.vars.spotTarget !== e.id) {
        m.vars.spotTarget = e.id;
        m.buffs = m.buffs.filter((b) => b.id !== 'w2_spot');
        return;
      }
      m.addBuff({ id: 'w2_spot', label: '핀 조명', dur: 4, atk: q.v1 / 100, maxStacks: q.def.v2 });
    },
  },
  /** 피날레의 인사: 처치 시 공격 속도 증가 */
  w2_bow: {
    kill(_w, m, q) {
      m.addBuff({ id: 'w2_bow', label: '피날레의 인사', dur: q.def.v2, aspd: q.v1 / 100, maxStacks: 3 });
    },
  },

  // ---- 방어구 ----
  /** 밀짚 속: 확률로 밀짚이 대신 맞는다 (받은 피해의 일부를 바로 회복) */
  a2_straw: {
    hurt(w, m, q, dmg) {
      if (q.cd > 0 || m.hp <= 0 || !w.rng.chance(q.def.chance / 100)) return;
      q.cd = q.def.cooldown;
      w.heal(m, (dmg * q.v1) / 100);
      w.fx.label(w.party.x, w.party.y - 96, '밀짚 속', 0xe8c56a);
    },
  },
  /** 양철 갑옷: 맞을수록 단단해진다 */
  a2_tin: {
    hurt(_w, m, q) {
      m.addBuff({ id: 'a2_tin', label: '양철 갑옷', dur: q.def.v2, guard: q.v1 / 100, maxStacks: 3 });
    },
  },
  /** 녹슨 가시: 공격한 적에게 반사 피해 + 둔화 */
  a2_rust: {
    hurt(w, m, q, _dmg, src) {
      if (q.cd > 0 || !src || src.dead) return;
      q.cd = q.def.cooldown;
      w.fx.bolt(w.party.x, w.party.y - 30, src.x, src.y - src.r, 0xc98a5a);
      w.hit(src, equipHit(m, q.v1 / 100));
      if (!src.dead) src.addDebuff('slow', q.def.v2, 0.4);
    },
  },
  /** 막 뒤로: 체력이 낮아지면 잠깐 무적 + 이동 속도 */
  a2_curtain: {
    hurt(w, m, q) {
      if (q.cd > 0 || m.hp <= 0 || m.hp > m.stats.maxHp * 0.35) return;
      q.cd = q.def.cooldown;
      w.party.invulnT = Math.max(w.party.invulnT, q.v1);
      m.addBuff({ id: 'a2_curtain', label: '막 뒤로', dur: q.v1 + 2, speed: q.def.v2 / 100, key: true });
      w.fx.ring(w.party.x, w.party.y, 70, 0xb23a4a, 0.4);
      w.fx.label(w.party.x, w.party.y - 96, '막 뒤로', 0xff8a9a);
    },
  },
  /** 양귀비 향: 맞으면 주변 적을 잠재운다 */
  a2_poppy: {
    hurt(w, _m, q) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      const p = w.party;
      w.fx.ring(p.x, p.y, q.def.v2, 0xff7a9a, 0.4);
      w.shove(p.x, p.y, q.def.v2, 0, q.v1);
    },
  },
  /** 빌린 심장: 치명적 피해를 한 번 버틴다 */
  a2_heart: {
    fatal(w, m, q) {
      if (q.used) return false;
      q.used = true;
      m.hp = Math.max(1, Math.round((m.stats.maxHp * Math.min(100, q.v1)) / 100));
      w.party.invulnT = Math.max(w.party.invulnT, 0.8);
      w.fx.ring(w.party.x, w.party.y, 80, 0xff5a7a, 0.5);
      w.fx.label(w.party.x, w.party.y - 96, '빌린 심장', 0xff8aa0);
      return true;
    },
  },
  /** 잿불 망토: 맞으면 주변 적에게 화상 */
  a2_ember: {
    hurt(w, m, q) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      const p = w.party;
      const r = 150;
      w.fx.play('fire.burst', p.x, p.y, { size: r, color: 0xff8a3c });
      for (const e of w.enemies) {
        if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= r + e.r) e.addDebuff('burn', q.def.v2, (m.atk() * q.v1) / 100);
      }
    },
  },

  // ---- 악세서리·심볼 ----
  c2_shoes: {
    dodge(_w, m, q) {
      m.addBuff({ id: 'c2_shoes', label: '은 구두', dur: q.def.v2, speed: q.v1 / 100 });
    },
  },
  c2_cap: {
    ult(w, _m, q) {
      w.pet.cd = Math.max(0, w.pet.cd - q.v1);
    },
  },
  c2_script: {
    swapIn(_w, m, q) {
      m.reduceCooldown(q.v1);
    },
  },
  c2_bouquet: {
    kill(_w, m, q) {
      if (q.cd > 0) return;
      q.cd = q.def.cooldown;
      const max = db.P('ult.max');
      m.ult = Math.min(max, m.ult + (max * q.v1) / 100);
    },
  },
  c2_mask: {
    ult(_w, m, q) {
      m.addBuff({ id: 'c2_mask', label: '두 얼굴의 가면', dur: q.def.v2, atk: q.v1 / 100, key: true });
    },
  },
  // 팀 공통 스킬: 관람권은 월드가, 초록 안경은 경로 선택이 직접 확인한다
  c2_ticket: {},
  c2_glasses: {},
};
