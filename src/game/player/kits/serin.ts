// 서린 — A급 / 리더 / 실체 / 대검
// 기본 공격: 대검 3연격 (부채꼴 근접 범위) · 액티브: 검기 사출 · 궁극기: 붕괴 일섬
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`serin.${k}`);
const COLOR = 0xffc2c9;

export const serin: Kit = {
  basic({ w, p, m, aim }) {
    const third = m.combo % 3 === 2;
    const aspd = m.aspd();
    const windup = V('basic.windup') / aspd;
    const interval = (third ? V('basic.interval3') : V('basic.interval')) / aspd;
    const reach = (third ? V('basic.reach3') : V('basic.reach')) * m.stats.range;
    const arc = deg(third ? V('basic.arc3') : V('basic.arc'));
    const mult = (third ? V('basic.dmg3') : V('basic.dmg1')) / 100;
    const knock = third ? V('basic.knock3') : V('basic.knock');

    p.force(aim, V('basic.lunge'), windup);
    p.after(w, windup, () => {
      w.fx.slash(p.x, p.y, aim, reach, arc, COLOR, third);
      const n = w.meleeArc(p.x, p.y, aim, reach, arc, { m, mult, kind: 'basic', knock });
      if (third && n > 0) {
        w.fx.shake(3);
        // 패시브: 3타 적중 시 액티브 쿨타임 감소
        m.reduceCooldown(V('passive.cdr'));
      }
    });
    m.combo++;
    m.comboT = interval + 0.7;
    return interval;
  },

  active({ w, p, m, aim }) {
    p.after(w, V('active.windup'), () => {
      w.fx.slash(p.x, p.y, aim, 90, deg(140), COLOR, true);
      w.shoot({
        angle: aim,
        speed: V('active.speed'),
        range: V('active.range'),
        r: V('active.radius'),
        look: 'wave',
        color: COLOR,
        pierce: -1,
        hit: { m, mult: V('active.dmg') / 100, kind: 'active', knock: 60 },
      });
    });
    return V('active.lock');
  },

  ult({ w, p, m, aim }) {
    const r = V('ult.radius');
    // 궁극기는 시전하면 끊기지 않는다
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      const cx = p.x + Math.cos(aim) * V('ult.offset');
      const cy = p.y + Math.sin(aim) * V('ult.offset');
      w.fx.blast(cx, cy, r, COLOR, 0.45);
      w.fx.ring(cx, cy, r, 0xffffff, 0.4);
      w.fx.shake(12);
      w.areaHit(cx, cy, r, { m, mult: V('ult.dmg') / 100, kind: 'ult', knock: 120, stun: V('ult.stun') }, p.x, p.y);
    });
    return V('ult.lock');
  },
};
