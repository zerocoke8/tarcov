// 하루 — A급 / 리더 / 반전 / 쌍검
// 기본 공격: 쌍검 4연격 · 액티브: 그림자 베기 (돌진, 충전식) · 궁극기: 난무
//
// 고유 성장 중 능력치만 바뀌는 것(급소 베기, 그림자 충전)은 run/stats.ts에 있다.
import { clamp, deg } from '../../../core/math';
import { db } from '../../../data/tables';
import { resolveCircle, solidAtPx } from '../../world/collision';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`haru.${k}`);
const COLOR = 0xc9b8ff;

export const haru: Kit = {
  color: COLOR,

  // 등장 기술 "교차 베기": 겨눈 적을 X자로 베며 지나쳐 그 뒤에 선다. 지나치기에는 먼 적이면 그 앞까지 달려들어 벤다
  entry({ w, p, m, aim, target }) {
    const windup = V('entry.windup');
    const sx = p.x;
    const sy = p.y;
    const max = db.P('swap.entryLunge');
    // 겨눈 적이 없으면 반걸음만 내딛는다
    let dist = db.P('swap.entryStep');
    if (target) {
      const d = Math.hypot(target.x - sx, target.y - sy);
      // 적의 몸을 지나 그 뒤에 서는 데 필요한 거리. 정해진 거리 안이면 지나치고, 아니면 적 앞에서 멈춘다 (적의 몸 안에 서지 않는다)
      const through = d + target.r + V('entry.past');
      dist = through <= max + V('entry.past') ? through : clamp(d - target.r - V('entry.standoff'), 0, max);
    }
    p.force(aim, dist, windup);
    // 마무리 4타의 그림을 쓴다. 다음 기본 공격은 1타부터 다시 시작한다
    m.combo = 4;
    m.comboT = V('entry.lock') + 0.3;
    p.after(w, windup, () => {
      w.fx.play('haru.dash', sx, sy, { x2: p.x, y2: p.y, color: COLOR });
      if (target && !target.dead) w.fx.play('haru.ult.cut', target.x, target.y, { angle: aim, color: COLOR, h: target.r });
      // 지나온 길과, 멈춘 자리에서 칼이 닿는 데까지
      const reach = V('entry.reach');
      w.lineHit(sx, sy, p.x + Math.cos(aim) * reach, p.y + Math.sin(aim) * reach, V('entry.half'), {
        m,
        mult: V('entry.dmg') / 100,
        kind: 'proc',
        knock: V('entry.knock'),
      });
    });
    return V('entry.lock');
  },

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
      if (db.P('fx.basicRange')) w.fx.slash(p.x, p.y, aim, reach, arc, COLOR, fourth || empowered);
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
      if (m.dead || !p.stillActing(m)) return;
      // 지나온 경로 위의 적을 벤다. 배후 일격: 피해 증가
      const mult = (V('active.dmg') / 100) * (1 + (w.run.lv('haru_back') * db.upgrade('haru_back').v1) / 100);
      w.fx.play('haru.dash', sx, sy, { x2: p.x, y2: p.y, color: COLOR });
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
        w.fx.play('haru.ult.cut', t.x, t.y, { angle: p.facing, color: COLOR, h: t.r });
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
    w.fx.label(w.party.x, w.party.y, '잔상', COLOR, 96);
  },
};
