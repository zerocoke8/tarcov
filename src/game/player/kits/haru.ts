// 하루 — A급 / 리더 / 반전 / 쌍검
// 기본 공격: 쌍검 4연격 · 액티브: 그림자 베기 (돌진, 충전식) · 궁극기: 난무
//
// 고유 성장 중 능력치만 바뀌는 것(급소 베기, 그림자 충전)은 run/stats.ts에 있다.
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import { resolveCircle, solidAtPx } from '../../world/collision';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`haru.${k}`);
const COLOR = 0xc9b8ff;

export const haru: Kit = {
  basic({ w, p, m, aim }) {
    const fourth = m.combo % 4 === 3;
    const aspd = m.aspd();
    const windup = V('basic.windup') / aspd;
    const interval = (fourth ? V('basic.interval4') : V('basic.interval')) / aspd;
    // 잔상 강화: 회피 직후 첫 공격은 넓은 범위 베기
    const empowered = m.vars.after === 1;
    m.vars.after = 0;
    p.force(aim, V('basic.lunge'), windup);
    p.after(w, windup, () => {
      let reach = V('basic.reach') * m.stats.range;
      let arc = deg(V('basic.arc')) * (fourth ? 1.4 : 1);
      let mult = (fourth ? V('basic.dmg4') : V('basic.dmg1')) / 100;
      if (empowered) {
        reach *= 1.5;
        arc = deg(300);
        mult *= 1 + (w.run.lv('haru_after') * db.upgrade('haru_after').v1) / 100;
      }
      w.fx.slash(p.x, p.y, aim, reach, arc, COLOR, fourth || empowered);
      // 흡혈 칼날: 준 피해의 일부만큼 회복
      const leech = w.run.lv('haru_leech');
      const ratio = (leech * db.upgrade('haru_leech').v1) / 100;
      w.meleeArc(p.x, p.y, aim, reach, arc, {
        m,
        mult,
        kind: 'basic',
        knock: V('basic.knock'),
        onHit: leech > 0 ? (_e, dmg) => w.heal(m, dmg * ratio) : undefined,
      });
    });
    m.combo++;
    m.comboT = interval + 0.6;
    return interval;
  },

  active({ w, p, m, aim }) {
    const sx = p.x;
    const sy = p.y;
    const dashTime = V('active.dashTime');
    p.dash(aim, V('active.dash'), dashTime, true);
    w.after(dashTime, () => {
      if (m.dead || p.active !== m) return;
      // 지나온 경로 위의 적을 벤다. 배후 일격: 피해 증가
      const mult = (V('active.dmg') / 100) * (1 + (w.run.lv('haru_back') * db.upgrade('haru_back').v1) / 100);
      w.fx.bolt(sx, sy - 24, p.x, p.y - 24, COLOR);
      w.fx.slash(p.x, p.y, aim + Math.PI, 80, deg(200), COLOR, true);
      w.lineHit(sx, sy, p.x, p.y, V('active.half'), { m, mult, kind: 'active', knock: 40 });
    });
    return V('active.lock');
  },

  ult({ w, p, m }) {
    const hits = V('ult.hits');
    const gap = V('ult.gap');
    const ox = p.x;
    const oy = p.y;
    for (let i = 0; i < hits; i++) {
      w.after(0.1 + i * gap, () => {
        if (m.dead || p.active !== m) return;
        // 처음 선 자리에서 닿는 적들 사이를 오간다
        const pool = w.enemies.filter(
          (e) => !e.dead && Math.hypot(e.x - ox, e.y - oy) <= V('ult.range') + e.r && w.los(ox, oy, e.x, e.y),
        );
        if (!pool.length) return;
        const t = w.rng.pick(pool);
        const a = w.rng.range(0, Math.PI * 2);
        const nx = t.x + Math.cos(a) * (t.r + 28);
        const ny = t.y + Math.sin(a) * (t.r + 28);
        if (!solidAtPx(w.grid, nx, ny)) {
          p.x = nx;
          p.y = ny;
          resolveCircle(w.grid, p);
        }
        p.facing = Math.atan2(t.y - p.y, t.x - p.x);
        w.fx.slash(p.x, p.y, p.facing, 90, deg(160), COLOR, true);
        w.areaHit(t.x, t.y, 70, { m, mult: V('ult.dmg') / 100, kind: 'ult' }, p.x, p.y);
      });
    }
    return Math.max(V('ult.lock'), 0.1 + hits * gap + 0.1);
  },

  // 잔상 강화: 회피하면 다음 기본 공격이 강화된다
  onDodge(w, m) {
    if (w.run.lv('haru_after') > 0) m.vars.after = 1;
  },

  // 패시브 "잔상": 무적 시간으로 공격을 흘리면 임팩트 갱신 + 액티브 충전 쿨타임 감소
  onEvade(w, m) {
    if (w.time < (m.vars.evadeT ?? 0)) return;
    m.vars.evadeT = w.time + 0.5;
    m.triggerReverse();
    m.reduceCooldown(V('passive.cdr'));
    w.fx.label(w.party.x, w.party.y - 96, '잔상', COLOR);
  },
};
