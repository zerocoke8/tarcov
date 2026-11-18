// 라이 — A급 / 타격 / 자연 / 메카 건틀렛
// 기본 공격: 연속 전격 발사체 · 액티브: 주변 범위 에너지 방출 · 궁극기: 뇌운
//
// 고유 성장 중 능력치만 바뀌는 것(과충전)은 run/stats.ts에 있다.
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`mido.${k}`);
const COLOR = 0x8ff5e0;

export const mido: Kit = {
  color: COLOR,
  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      const spread = deg(V('basic.spread'));
      // 전격 파열: 적중 지점에 소범위 폭발
      const burst = w.run.lv('mido_burst');
      const u = db.upgrade('mido_burst');
      w.shoot({
        x: p.x + Math.cos(aim) * 20,
        y: p.y + Math.sin(aim) * 20,
        angle: aim + w.rng.range(-spread, spread),
        speed: V('basic.speed'),
        range: V('basic.range') * m.stats.range,
        r: V('basic.radius'),
        look: 'bolt',
        color: COLOR,
        hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: 6 },
        splash: burst > 0 ? { r: u.v2 + u.v3 * (burst - 1), mult: u.v1 / 100 } : undefined,
      });
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m }) {
    // 방출 확장: 범위 증가
    const range = w.run.lv('mido_nova_range');
    const r = V('active.radius') * (1 + (range * db.upgrade('mido_nova_range').v1) / 100);
    p.after(w, V('active.windup'), () => {
      w.fx.play('mido.nova', p.x, p.y, { size: r, color: COLOR });
      w.fx.shake(6);
      // 감전: 받는 피해 증가 + 둔화
      const jolt = w.run.lv('mido_jolt');
      const u = db.upgrade('mido_jolt');
      w.areaHit(p.x, p.y, r, {
        m,
        mult: V('active.dmg') / 100,
        kind: 'active',
        knock: 90,
        onHit:
          jolt > 0
            ? (e) => {
                e.addDebuff('jolt', u.v2, (jolt * u.v1) / 100);
                e.addDebuff('slow', u.v2, u.v3 / 100);
              }
            : undefined,
      });
    });
    return V('active.lock');
  },

  ult({ w, p, m }) {
    // 뇌운: 가까운 적부터 차례로 낙뢰를 떨어뜨린다. 범위가 아니라 적을 골라 치므로 흩어진 적에게 강하다.
    // 적이 적으면 같은 적을 다시 치되, 두 번째부터는 피해가 줄어든다
    const count = V('ult.count');
    const range = V('ult.range');
    const r = V('ult.radius');
    const struck = new Map<object, number>();
    const dist = (e: { x: number; y: number }): number => Math.hypot(e.x - p.x, e.y - p.y);
    for (let i = 0; i < count; i++) {
      w.after(V('ult.windup') + i * V('ult.gap'), () => {
        if (m.dead) return;
        const pool = w.enemies.filter((e) => !e.dead && dist(e) <= range + e.r);
        if (!pool.length) return;
        // 덜 맞은 적 먼저, 그중 가까운 적 먼저
        pool.sort((a, b) => (struck.get(a) ?? 0) - (struck.get(b) ?? 0) || dist(a) - dist(b));
        const t = pool[0];
        const before = struck.get(t) ?? 0;
        struck.set(t, before + 1);
        const x = t.x;
        const y = t.y;
        const mult = (V('ult.dmg') / 100) * (before === 0 ? 1 : V('ult.repeat') / 100);
        w.fx.play('mido.ult.strike', x, y, { size: r, color: COLOR });
        w.after(0.1, () => {
          w.fx.shake(3);
          w.areaHit(x, y, r, { m, mult, kind: 'ult' });
        });
      });
    }
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

  // 연쇄 증폭: 연쇄 대상과 피해 증가
  natureChain(w) {
    const lv = w.run.lv('mido_chain');
    const u = db.upgrade('mido_chain');
    return { extraTargets: lv * u.v1, bonus: (lv * u.v2) / 100 };
  },
};
