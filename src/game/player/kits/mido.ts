// 미도 — A급 / 타격 / 자연 / 메카 건틀렛
// 기본 공격: 연속 전격 발사체 · 액티브: 주변 범위 에너지 방출 · 궁극기: 뇌운
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`mido.${k}`);
const COLOR = 0x8ff5e0;

export const mido: Kit = {
  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      const spread = deg(V('basic.spread'));
      const a = aim + w.rng.range(-spread, spread);
      w.shoot({
        x: p.x + Math.cos(aim) * 20,
        y: p.y + Math.sin(aim) * 20,
        angle: a,
        speed: V('basic.speed'),
        range: V('basic.range') * m.stats.range,
        r: V('basic.radius'),
        look: 'bolt',
        color: COLOR,
        hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: 6 },
      });
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m }) {
    const r = V('active.radius') * m.stats.range;
    p.after(w, V('active.windup'), () => {
      w.fx.blast(p.x, p.y, r, COLOR, 0.35);
      w.fx.ring(p.x, p.y, r, 0xffffff, 0.35);
      w.fx.shake(6);
      w.areaHit(p.x, p.y, r, { m, mult: V('active.dmg') / 100, kind: 'active', knock: 90 });
    });
    return V('active.lock');
  },

  ult({ w, p, m }) {
    const range = V('ult.range');
    const r = V('ult.radius');
    w.addZone({
      look: 'storm',
      team: 'party',
      x: p.x,
      y: p.y,
      r: range,
      dur: V('ult.duration'),
      color: COLOR,
      follow: true,
      tick: V('ult.tick'),
      onTick: (z) => {
        // 범위 안의 적 중 하나에게 낙뢰
        const pool = w.enemies.filter((e) => !e.dead && Math.hypot(e.x - z.x, e.y - z.y) <= range + e.r);
        if (!pool.length) return;
        const t = w.rng.pick(pool);
        const x = t.x;
        const y = t.y;
        w.fx.strike(x, y, COLOR);
        w.after(0.12, () => {
          w.fx.blast(x, y, r, COLOR, 0.2);
          w.areaHit(x, y, r, { m, mult: V('ult.dmg') / 100, kind: 'ult' });
        });
      },
    });
    return V('ult.lock');
  },

  // 패시브: 전이 상태의 적을 처치하면 주변 적에게 전이가 퍼진다
  onKill(w, _m, e) {
    if (!e.hasDebuff('shock')) return;
    const range = V('passive.spreadRange');
    const dur = db.P('attr.nature.duration');
    for (const o of w.enemies) {
      if (o.dead || o === e || Math.hypot(o.x - e.x, o.y - e.y) > range) continue;
      if (!o.hasDebuff('shock')) w.fx.bolt(e.x, e.y - e.r, o.x, o.y - o.r, 0xa8f5ff);
      o.addDebuff('shock', dur);
    }
  },
};
