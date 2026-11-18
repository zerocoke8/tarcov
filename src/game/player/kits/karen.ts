// 카렌 — S급 / 타격 / 반전 / 산탄총
// 기본 공격: 근거리 부채꼴 산탄 · 액티브: 돌파 사격 (돌진 후 근접 사격) · 궁극기: 반전 폭발
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`karen.${k}`);
const COLOR = 0xff8f8f;

export const karen: Kit = {
  color: COLOR,
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
      w.fx.play('muzzle', ox, oy, { angle: aim, color: COLOR, size: 64 });
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
      w.fx.play('karen.blast', p.x, p.y, { angle: aim, size: reach, arc, color: COLOR });
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
    // 반전 폭발: 코앞의 부채꼴에 산탄을 연달아 쏟아붓는다. 마지막 발 뒤에 회피와 액티브가 돌아온다
    const shots = V('ult.shots');
    const gap = V('ult.gap');
    const reach = V('ult.reach');
    const arc = deg(V('ult.arc'));
    for (let i = 0; i < shots; i++) {
      w.after(V('ult.windup') + i * gap, () => {
        if (m.dead) return;
        // 노리던 적이 살아 있으면 그쪽으로 총구를 계속 돌린다
        const a = target && !target.dead ? Math.atan2(target.y - p.y, target.x - p.x) : aim;
        w.fx.play('karen.blast', p.x, p.y, { angle: a, size: reach, arc, color: COLOR });
        w.fx.shake(5);
        w.meleeArc(p.x, p.y, a, reach, arc, { m, mult: V('ult.dmg') / 100, kind: 'ult', knock: V('ult.knock') });
        if (i === shots - 1) {
          // 회피 카운트와 액티브 쿨타임 초기화
          p.dodgeCharges = m.stats.dodgeCharges;
          m.charges = m.maxCharges();
          m.cd = 0;
        }
      });
    }
    return V('ult.windup') + shots * gap + 0.12;
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
