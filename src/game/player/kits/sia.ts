// 시아 — A급 / 지원 / 형상 / 활
// 기본 공격: 단일 화살 투사체 · 액티브: 범위 화살비 · 궁극기: 만월의 화살
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`sia.${k}`);
const COLOR = 0xbfd4ff;

export const sia: Kit = {
  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      w.shoot({
        x: p.x + Math.cos(aim) * 18,
        y: p.y + Math.sin(aim) * 18,
        angle: aim,
        speed: V('basic.speed'),
        range: V('basic.range') * m.stats.range,
        r: V('basic.radius'),
        look: 'arrow',
        color: COLOR,
        hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: 20 },
      });
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m, aim, target }) {
    const r = V('active.radius') * m.stats.range;
    // 조준된 적이 있으면 그 자리에, 없으면 조준 방향 앞쪽에 놓는다
    const x = target ? target.x : p.x + Math.cos(aim) * V('active.castRange');
    const y = target ? target.y : p.y + Math.sin(aim) * V('active.castRange');
    w.addZone({
      look: 'rain',
      team: 'party',
      x,
      y,
      r,
      dur: V('active.duration'),
      color: COLOR,
      tick: V('active.tick'),
      onTick: (z) => {
        w.areaHit(z.x, z.y, z.r, { m, mult: V('active.dmg') / 100, kind: 'active' });
      },
    });
    return V('active.lock');
  },

  ult({ w, p, m, aim }) {
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      w.fx.shake(8);
      w.shoot({
        angle: aim,
        speed: V('ult.speed'),
        range: V('ult.range'),
        r: V('ult.radius'),
        look: 'bigarrow',
        color: COLOR,
        pierce: -1,
        wall: false,
        hit: { m, mult: V('ult.dmg') / 100, kind: 'ult', knock: 80 },
        onHitEnemy: (e) => e.addDebuff('mark', V('ult.markDur'), V('ult.mark') / 100),
      });
    });
    return V('ult.lock');
  },

  // 패시브: 오프 필드일 때 필드 캐릭터의 치명타 확률 증가
  aura(_m, aura) {
    aura.crit += V('passive.crit') / 100;
  },
};
