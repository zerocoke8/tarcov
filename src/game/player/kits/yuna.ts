// 유나 — S급 / 리더 / 형상 / 기관단총
// 기본 공격: 고속 연사 · 액티브: 자율 포탑 설치 · 궁극기: 집중 포화
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Zone } from '../../entities';
import type { World } from '../../world/World';
import type { Kit } from '../kit';
import type { Member } from '../Member';

const V = (k: string): number => db.sv(`yuna.${k}`);
const COLOR = 0xb9c4ff;

/** 캐릭터별로 지금 깔려 있는 포탑 */
const turrets = new WeakMap<Member, Zone[]>();

/** 집중 포화가 켜져 있는지 */
const overdrive = (w: World, m: Member): boolean => (m.vars.over ?? 0) > w.time;

export const yuna: Kit = {
  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      const spread = deg(V('basic.spread'));
      // 철갑탄: 관통. 집중 포화 중에는 관통이 더 붙는다
      const pierce = w.run.lv('yuna_ap') * db.upgrade('yuna_ap').v1 + (overdrive(w, m) ? 2 : 0);
      w.shoot({
        x: p.x + Math.cos(aim) * 22,
        y: p.y + Math.sin(aim) * 22,
        angle: aim + w.rng.range(-spread, spread),
        speed: V('basic.speed'),
        range: V('basic.range') * m.stats.range,
        r: V('basic.radius'),
        look: 'bullet',
        color: COLOR,
        pierce,
        hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: 4 },
      });
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m, aim }) {
    const run = w.run;
    const more = db.upgrade('yuna_turret_n');
    const max = 1 + run.lv('yuna_turret_n') * more.v1;
    const list = (turrets.get(m) ?? []).filter((z) => !z.dead);
    // 한도를 넘으면 가장 오래된 포탑을 치운다
    while (list.length >= max) list.shift()!.dead = true;

    const range = V('active.range');
    const z = w.addZone({
      look: 'turret',
      team: 'party',
      x: p.x + Math.cos(aim) * 44,
      y: p.y + Math.sin(aim) * 44,
      r: range,
      dur: V('active.duration') + run.lv('yuna_turret_n') * more.v2,
      color: COLOR,
      tick: V('active.tick'),
      onTick: (zone) => {
        // 집중 포화 중에는 두 배로 빨리 쏜다
        zone.tick = V('active.tick') / (overdrive(w, m) ? 2 : 1);
        const party = w.party;
        // 정비 드론: 포탑 주변의 필드 캐릭터 회복
        const drone = run.lv('yuna_drone');
        if (drone > 0 && Math.hypot(party.x - zone.x, party.y - zone.y) <= 170) {
          const a = party.active;
          w.heal(a, ((a.stats.maxHp * drone * db.upgrade('yuna_drone').v1) / 100) * zone.tick);
        }
        const t = w.nearestEnemy(zone.x, zone.y, range, (e) => w.los(zone.x, zone.y, e.x, e.y));
        if (!t) return;
        const dmg = (V('active.dmg') / 100) * (1 + (run.lv('yuna_turret_dmg') * db.upgrade('yuna_turret_dmg').v1) / 100);
        w.shoot({
          x: zone.x,
          y: zone.y,
          angle: Math.atan2(t.y - zone.y, t.x - zone.x),
          speed: 1000,
          range,
          r: 6,
          look: 'bullet',
          color: COLOR,
          hit: { m, mult: dmg, kind: 'active' },
        });
      },
    });
    list.push(z);
    turrets.set(m, list);
    return V('active.lock');
  },

  ult({ w, m }) {
    const dur = V('ult.duration');
    m.vars.over = w.time + dur;
    // 연사 속도 2배
    m.addBuff({ id: 'yuna_over', label: '집중 포화', dur, aspd: 1 });
    return V('ult.lock');
  },

  // 패시브: 빌드업이 최대일 때 치명타 확률 증가
  critBonus(m) {
    return m.formStacks >= m.formMax() ? V('passive.crit') / 100 : 0;
  },

  // 빌드업 확장: 최대 중첩 증가
  trait(m) {
    return { formMax: m.run.lv('yuna_stack') * db.upgrade('yuna_stack').v1 };
  },
};
