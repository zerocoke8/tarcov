// 카렌 — S급 / 타격 / 반전 / 산탄총
// 기본 공격: 근거리 부채꼴 산탄 · 액티브: 돌파 사격 (돌진 후 근접 사격) · 궁극기: 반전 폭발
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`karen.${k}`);
const COLOR = 0xff8f8f;

export const karen: Kit = {
  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      // 확산탄: 산탄 수 증가
      const n = V('basic.pellets') + w.run.lv('karen_pellet') * db.upgrade('karen_pellet').v1;
      const spread = deg(V('basic.spread'));
      const ox = p.x + Math.cos(aim) * 20;
      const oy = p.y + Math.sin(aim) * 20;
      for (let i = 0; i < n; i++) {
        w.shoot({
          x: ox,
          y: oy,
          angle: aim + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0) + w.rng.range(-0.03, 0.03),
          speed: V('basic.speed') * w.rng.range(0.9, 1.1),
          range: V('basic.range') * m.stats.range,
          r: V('basic.radius'),
          look: 'pellet',
          color: COLOR,
          hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: V('basic.knock') },
        });
      }
      w.fx.sparks(ox, oy - 24, 0xffe0a8, 4);
      w.fx.shake(2);
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m, aim }) {
    const dashTime = V('active.dashTime');
    p.dash(aim, V('active.dash'), dashTime, true);
    let refunded = false;
    w.after(dashTime, () => {
      if (m.dead || p.active !== m) return;
      const reach = V('active.reach');
      const arc = deg(V('active.arc'));
      w.fx.slash(p.x, p.y, aim, reach, arc, COLOR, true);
      w.fx.shake(6);
      w.meleeArc(p.x, p.y, aim, reach, arc, {
        m,
        mult: V('active.dmg') / 100,
        kind: 'active',
        knock: 120,
        onHit: (e) => {
          // 연속 돌파: 이 사격으로 처치하면 쿨타임 반환
          const lv = w.run.lv('karen_dash');
          if (lv <= 0 || refunded || e.hp > 0) return;
          refunded = true;
          m.reduceCooldown(m.cooldown() * Math.min(1, (lv * db.upgrade('karen_dash').v1) / 100));
        },
      });
    });
    return V('active.lock');
  },

  ult({ w, p, m, aim, target }) {
    const r = V('ult.radius');
    const x = target ? target.x : p.x + Math.cos(aim) * V('ult.range');
    const y = target ? target.y : p.y + Math.sin(aim) * V('ult.range');
    w.addZone({ look: 'aim', team: 'party', x, y, r, dur: V('ult.windup'), color: COLOR });
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      w.fx.blast(x, y, r, COLOR, 0.45);
      w.fx.ring(x, y, r, 0xffffff, 0.4);
      w.fx.shake(12);
      w.areaHit(x, y, r, { m, mult: V('ult.dmg') / 100, kind: 'ult', knock: 150 }, p.x, p.y);
      // 회피 카운트와 액티브 쿨타임 초기화
      p.dodgeCharges = m.stats.dodgeCharges;
      m.charges = m.maxCharges();
      m.cd = 0;
    });
    return V('ult.lock');
  },

  // 패시브: 가까운 적에게 주는 피해 증가 (+ 영거리 사격, 마무리)
  dmgMult(w, m, e) {
    let mult = 1;
    const p = w.party;
    if (Math.hypot(e.x - p.x, e.y - p.y) - e.r <= V('passive.range')) {
      mult += (V('passive.bonus') + w.run.lv('karen_point') * db.upgrade('karen_point').v1) / 100;
    }
    const exec = w.run.lv('karen_exec');
    if (exec > 0) {
      const u = db.upgrade('karen_exec');
      if (e.hp / e.maxHp <= u.v2 / 100) mult *= 1 + (exec * u.v1) / 100;
    }
    return mult;
  },

  // 반전 증폭: 임팩트 효과와 지속시간 증가
  trait(m) {
    const lv = m.run.lv('karen_reverse');
    const u = db.upgrade('karen_reverse');
    return { reverseBonus: (lv * u.v1) / 100, reverseDur: lv * u.v2 };
  },
};
