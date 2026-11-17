// 라온 — A급 / 타격 / 실체 / 해머
// 기본 공격: 해머 3연타 (3타는 충격파) · 액티브: 지면 강타 · 궁극기: 유성 낙하
//
// 고유 성장 중 능력치만 바뀌는 것(강철 몸)은 run/stats.ts에 있다.
import { clamp, deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { World } from '../../world/World';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`raon.${k}`);
const COLOR = 0xffc27a;

/** 충격 확장: 지면 강타·궁극기 범위 배율 */
const wide = (w: World): number => 1 + (w.run.lv('raon_wide') * db.upgrade('raon_wide').v1) / 100;

export const raon: Kit = {
  basic({ w, p, m, aim }) {
    const third = m.combo % 3 === 2;
    const aspd = m.aspd();
    const windup = V('basic.windup') / aspd;
    const interval = (third ? V('basic.interval3') : V('basic.interval')) / aspd;
    const reach = V('basic.reach') * m.stats.range;
    p.force(aim, V('basic.lunge'), windup);
    p.after(w, windup, () => {
      if (third) {
        // 3타: 전방에 충격파
        const r = V('basic.shockRadius') * m.stats.range;
        const cx = p.x + Math.cos(aim) * reach * 0.7;
        const cy = p.y + Math.sin(aim) * reach * 0.7;
        w.fx.blast(cx, cy, r, COLOR, 0.25);
        w.fx.ring(cx, cy, r, 0xffffff, 0.25);
        w.fx.shake(4);
        w.areaHit(cx, cy, r, { m, mult: V('basic.dmg3') / 100, kind: 'basic', knock: V('basic.knock3') }, p.x, p.y);
      } else {
        const arc = deg(V('basic.arc'));
        w.fx.slash(p.x, p.y, aim, reach, arc, COLOR);
        w.meleeArc(p.x, p.y, aim, reach, arc, { m, mult: V('basic.dmg1') / 100, kind: 'basic', knock: V('basic.knock') });
      }
    });
    m.combo++;
    m.comboT = interval + 0.7;
    return interval;
  },

  active({ w, p, m, aim }) {
    const r = V('active.radius') * wide(w);
    const cx = p.x + Math.cos(aim) * V('active.offset');
    const cy = p.y + Math.sin(aim) * V('active.offset');
    const windup = V('active.windup');
    w.addZone({ look: 'aim', team: 'party', x: cx, y: cy, r, dur: windup, color: COLOR });
    p.after(w, windup, () => {
      // 파쇄: 피해 증가
      const mult = (V('active.dmg') / 100) * (1 + (w.run.lv('raon_crush') * db.upgrade('raon_crush').v1) / 100);
      w.fx.blast(cx, cy, r, COLOR, 0.4);
      w.fx.ring(cx, cy, r, 0xffffff, 0.35);
      w.fx.shake(10);
      w.areaHit(cx, cy, r, { m, mult, kind: 'active', knock: 60, stun: V('active.stun') }, p.x, p.y);
      // 여진: 같은 자리에 2차 폭발
      const after = w.run.lv('raon_after');
      if (after > 0) {
        const u = db.upgrade('raon_after');
        w.addZone({ look: 'aim', team: 'party', x: cx, y: cy, r, dur: u.v2, color: COLOR });
        w.after(u.v2, () => {
          w.fx.blast(cx, cy, r, COLOR, 0.35);
          w.fx.shake(6);
          w.areaHit(cx, cy, r, { m, mult: (mult * after * u.v1) / 100, kind: 'active', knock: 40 });
        });
      }
    });
    return V('active.lock');
  },

  ult({ w, p, m, aim, target }) {
    const r = V('ult.radius') * wide(w);
    const leapTime = V('ult.leapTime');
    // 조준된 적이 있으면 그 앞까지, 없으면 조준 방향으로 도약
    const dist = target ? Math.min(V('ult.leap'), Math.max(0, Math.hypot(target.x - p.x, target.y - p.y) - target.r)) : V('ult.leap');
    p.dash(aim, dist, leapTime, true);
    w.after(leapTime, () => {
      if (m.dead) return;
      w.fx.blast(p.x, p.y, r, COLOR, 0.5);
      w.fx.ring(p.x, p.y, r, 0xffffff, 0.45);
      w.fx.shake(14);
      w.areaHit(p.x, p.y, r, { m, mult: V('ult.dmg') / 100, kind: 'ult', knock: V('ult.knock') });
    });
    return V('ult.lock');
  },

  // 패시브 "투지": 체력이 낮을수록 피해 증가 (+ 투지 강화)
  dmgMult(w, m) {
    const floor = V('passive.floor') / 100;
    const max = (V('passive.max') + w.run.lv('raon_guts') * db.upgrade('raon_guts').v1) / 100;
    const t = clamp((1 - m.hp / m.stats.maxHp) / (1 - floor), 0, 1);
    return 1 + max * t;
  },
};
